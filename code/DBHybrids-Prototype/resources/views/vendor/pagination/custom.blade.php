@if ($paginator->hasPages())
    <nav role="navigation" aria-label="Pagination Navigation">
        {{-- Info --}}
        <div class="pagination-info">
            {{ $paginator->firstItem() }}-{{ $paginator->lastItem() }} of {{ $paginator->total() }}
        </div>

        {{-- Page Numbers --}}
        <div class="pagination-pages">
            <ul>
                {{-- First Page --}}
                @if ($paginator->currentPage() > 1)
                    <li><a href="{{ $paginator->url(1) }}">1</a></li>
                @else
                    <li class="active"><span>1</span></li>
                @endif

                {{-- Dots before current page --}}
                @if ($paginator->currentPage() > 3)
                    <li><span class="dots">...</span></li>
                @endif

                {{-- Previous Page --}}
                @if ($paginator->currentPage() > 2)
                    <li><a href="{{ $paginator->url($paginator->currentPage() - 1) }}">{{ $paginator->currentPage() - 1 }}</a></li>
                @endif

                {{-- Current Page (if not first or last) --}}
                @if ($paginator->currentPage() > 1 && $paginator->currentPage() < $paginator->lastPage())
                    <li class="active"><span>{{ $paginator->currentPage() }}</span></li>
                @endif

                {{-- Next Page --}}
                @if ($paginator->currentPage() < $paginator->lastPage() - 1)
                    <li><a href="{{ $paginator->url($paginator->currentPage() + 1) }}">{{ $paginator->currentPage() + 1 }}</a></li>
                @endif

                {{-- Dots after current page --}}
                @if ($paginator->currentPage() < $paginator->lastPage() - 2)
                    <li><span class="dots">...</span></li>
                @endif

                {{-- Last Page --}}
                @if ($paginator->lastPage() > 1)
                    @if ($paginator->currentPage() < $paginator->lastPage())
                        <li><a href="{{ $paginator->url($paginator->lastPage()) }}">{{ $paginator->lastPage() }}</a></li>
                    @else
                        <li class="active"><span>{{ $paginator->lastPage() }}</span></li>
                    @endif
                @endif
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
