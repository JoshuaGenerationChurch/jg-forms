<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Services\JgDirectoryService;
use Illuminate\Http\JsonResponse;

class DigitalMediaOptionsController extends Controller
{
    public function __invoke(JgDirectoryService $jgDirectoryService): JsonResponse
    {
        return response()->json($jgDirectoryService->getDigitalMediaOptions());
    }
}
