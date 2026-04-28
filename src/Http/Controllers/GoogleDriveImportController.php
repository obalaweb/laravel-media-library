<?php

namespace Codprez\MediaLibrary\Http\Controllers;

use Codprez\MediaLibrary\Models\MediaImportBatch;
use Codprez\MediaLibrary\Services\GoogleDriveImportService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class GoogleDriveImportController extends Controller
{
    public function preview(Request $request, GoogleDriveImportService $service): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $service->preview($validated['url']),
        ]);
    }

    public function start(Request $request, GoogleDriveImportService $service): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'string'],
            'selected_file_ids' => ['nullable', 'array'],
            'selected_file_ids.*' => ['string'],
        ]);

        $batch = $service->startImport(
            $validated['url'],
            $validated['selected_file_ids'] ?? null
        );

        return response()->json([
            'success' => true,
            'batch' => [
                'id' => $batch->id,
                'status' => $batch->status,
                'total_count' => $batch->total_count,
                'pending_count' => $batch->pending_count,
                'processing_count' => $batch->processing_count,
                'imported_count' => $batch->imported_count,
                'failed_count' => $batch->failed_count,
                'skipped_count' => $batch->skipped_count,
            ],
        ]);
    }

    public function status(MediaImportBatch $batch): JsonResponse
    {
        if ((int) $batch->created_by !== (int) auth()->id()) {
            throw new AuthorizationException('You are not allowed to view this import batch.');
        }

        return response()->json([
            'success' => true,
            'batch' => [
                'id' => $batch->id,
                'status' => $batch->status,
                'total_count' => $batch->total_count,
                'pending_count' => $batch->pending_count,
                'processing_count' => $batch->processing_count,
                'imported_count' => $batch->imported_count,
                'failed_count' => $batch->failed_count,
                'skipped_count' => $batch->skipped_count,
            ],
        ]);
    }
}
