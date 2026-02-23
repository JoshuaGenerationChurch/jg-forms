<h2>{{ $heading }}</h2>

@php
    $containsHtml = preg_match('/<[^>]+>/', $body) === 1;
@endphp

@if ($containsHtml)
    {!! $body !!}
@else
    {!! nl2br(e($body)) !!}
@endif
