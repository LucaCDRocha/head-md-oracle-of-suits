@if ($paginator->hasPages())
    <nav role="navigation" aria-label="Pagination Navigation">
        {{-- Info --}}
        <div class="pagination-info">
            {{ $paginator->firstItem() }}-{{ $paginator->lastItem() }} of {{ $paginator->total() }}
        </div>

        {{-- Page Numbers --}}
        <div class="pagination-pages">
            <ul>
                @foreach ($elements as $element)
                    {{-- "Three Dots" Separator --}}
                    @if (is_string($element))
                        <li><span class="dots">{{ $element }}</span></li>
                    @endif

                    {{-- Array Of Links --}}
                    @if (is_array($element))
                        @foreach ($element as $page => $url)
                            @if ($page == $paginator->currentPage())
                                <li class="active"><span>{{ $page }}</span></li>
                            @else
                                <li><a href="{{ $url }}">{{ $page }}</a></li>
                            @endif
                        @endforeach
                    @endif
                @endforeach
            </ul>
        </div>

        {{-- Previous/Next Navigation --}}
        <div class="pagination-nav-buttons">
            @if ($paginator->onFirstPage())
                <span class="disabled">‹ Previous</span>
            @else
                <a href="{{ $paginator->previousPageUrl() }}" rel="prev">‹ Previous</a>
            @endif

            @if ($paginator->hasMorePages())
                <a href="{{ $paginator->nextPageUrl() }}" rel="next">Next ›</a>
            @else
                <span class="disabled">Next ›</span>
            @endif
        </div>
    </nav>
@endif
