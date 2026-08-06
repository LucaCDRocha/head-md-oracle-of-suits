<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Hybrid;
use App\Models\Like;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SecurityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_kiosk_post_requires_valid_token()
    {
        // 1. Without token -> 401
        $response = $this->postJson('/api/hybrids', []);
        $response->assertStatus(401)
                 ->assertJson(['error' => 'Unauthorized. Invalid Token.']);

        // 2. With invalid token -> 401
        $response = $this->withHeaders(['Authorization' => 'Bearer INVALID_TOKEN'])
                         ->postJson('/api/hybrids', []);
        $response->assertStatus(401)
                 ->assertJson(['error' => 'Unauthorized. Invalid Token.']);

        // 3. With valid token -> passes middleware (fails validation 422 for empty body)
        $validToken = config('app.kiosk_api_token', 'hybrids_kiosk_sec_9f8a7b6c5d4e3f2a1');
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $validToken])
                         ->postJson('/api/hybrids', []);
        $response->assertStatus(422); // Validation error (cards missing), meaning authorization passed!
    }

    public function test_like_endpoint_uses_device_id()
    {
        $hybrid = Hybrid::create([
            'name' => 'Test Hybrid',
            'nb_like' => 0,
        ]);

        $deviceId1 = 'device-uuid-1111';
        $deviceId2 = 'device-uuid-2222';

        // 1. First like from Device 1
        $res1 = $this->postJson("/api/hybrids/{$hybrid->id}/like", [
            'device_id' => $deviceId1,
            'action' => 'like',
        ]);

        $res1->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'nb_like' => 1,
                 'liked' => true,
             ]);

        $this->assertDatabaseHas('likes', [
            'hybrid_id' => $hybrid->id,
            'device_id' => $deviceId1,
        ]);

        // 2. Duplicate like from Device 1 (should not double count)
        $res2 = $this->postJson("/api/hybrids/{$hybrid->id}/like", [
            'device_id' => $deviceId1,
            'action' => 'like',
        ]);

        $res2->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'nb_like' => 1,
                 'liked' => true,
             ]);

        // 3. Like from Device 2 (different device UUID)
        $res3 = $this->postJson("/api/hybrids/{$hybrid->id}/like", [
            'device_id' => $deviceId2,
            'action' => 'like',
        ]);

        $res3->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'nb_like' => 2,
                 'liked' => true,
             ]);

        // 4. Unlike from Device 1
        $res4 = $this->postJson("/api/hybrids/{$hybrid->id}/like", [
            'device_id' => $deviceId1,
            'action' => 'unlike',
        ]);

        $res4->assertStatus(200)
             ->assertJson([
                 'success' => true,
                 'nb_like' => 1,
                 'liked' => false,
             ]);

        $this->assertDatabaseMissing('likes', [
            'hybrid_id' => $hybrid->id,
            'device_id' => $deviceId1,
        ]);
    }

    public function test_hybrids_index_supports_limit_and_sorting()
    {
        for ($i = 1; $i <= 15; $i++) {
            Hybrid::create([
                'name' => "Hybrid {$i}",
                'nb_like' => $i,
            ]);
        }

        $res = $this->getJson('/api/hybrids?limit=10&sort_by=nb_like');
        $res->assertStatus(200);

        $data = $res->json('data');
        $this->assertCount(10, $data);
        $this->assertEquals(15, $data[0]['nb_like']);
        $this->assertEquals(6, $data[9]['nb_like']);
    }
}
