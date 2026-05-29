<?php

namespace Codprez\MediaLibrary\Http\Controllers;

use Codprez\MediaLibrary\Http\Resources\MediaResource;
use Codprez\MediaLibrary\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function index(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $media = Media::query()
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->search, fn ($q) => $q->where(function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->search}%")
                      ->orWhere('original_name', 'like', "%{$request->search}%");
            }))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 40)
            ->withQueryString();

        if ($request->wantsJson()) {
            return response()->json([
                'media' => MediaResource::collection($media->getCollection()),
                'pagination' => [
                    'current_page' => $media->currentPage(),
                    'last_page' => $media->lastPage(),
                    'per_page' => $media->perPage(),
                    'total' => $media->total(),
                    'from' => $media->firstItem(),
                    'to' => $media->lastItem(),
                    'next_page_url' => $media->nextPageUrl(),
                    'prev_page_url' => $media->previousPageUrl(),
                ],
            ]);
        }

        return Inertia::render('admin/media/index', [
            'media' => MediaResource::collection($media),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'file' => [
                'sometimes',
                'file',
                'max:51200',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv',
            ],
            'files' => ['sometimes', 'array', 'min:1'],
            'files.*' => [
                'file',
                'max:51200',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv',
            ],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $files = $request->hasFile('files')
            ? $request->file('files')
            : ($request->hasFile('file') ? [$request->file('file')] : []);

        if ($files === []) {
            return response()->json([
                'success' => false,
                'message' => 'No files were provided for upload.',
            ], 422);
        }

        $mediaItems = [];
        foreach ($files as $file) {
            $name = $request->name ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $path = $file->store('media', 'public');

            $type = Media::getTypeFromMime($file->getMimeType(), $file->getClientOriginalName());
            $width = null;
            $height = null;
            $thumbnailPath = null;
            $thumbnailUrl = null;

            if ($type === 'image') {
                $dimensions = @getimagesize($file->getRealPath());
                if ($dimensions) {
                    $width = $dimensions[0];
                    $height = $dimensions[1];
                }
            } elseif ($type === 'video') {
                try {
                    $absVideoPath = Storage::disk('public')->path($path);
                    $thumbFilename = pathinfo($path, PATHINFO_FILENAME).'_thumb.jpg';
                    $thumbRelPath = 'media/'.$thumbFilename;
                    $absThumbPath = Storage::disk('public')->path($thumbRelPath);

                    $process = new \Symfony\Component\Process\Process([
                        '/usr/bin/ffmpeg', '-y', '-i', $absVideoPath, '-ss', '00:00:00', '-vframes', '1', $absThumbPath
                    ]);
                    $process->setTimeout(60);
                    $process->run();

                    if ($process->isSuccessful() && file_exists($absThumbPath)) {
                        $thumbnailPath = $thumbRelPath;
                        $thumbnailUrl = Storage::disk('public')->url($thumbRelPath);
                        $dimensions = @getimagesize($absThumbPath);
                        if ($dimensions) {
                            $width = $dimensions[0];
                            $height = $dimensions[1];
                        }
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Video thumbnail generation failed: ".$e->getMessage());
                }
            }

            $mediaItems[] = Media::create([
                'name' => $name,
                'original_name' => $file->getClientOriginalName(),
                'file_name' => basename($path),
                'mime_type' => $file->getMimeType(),
                'type' => $type,
                'path' => $path,
                'url' => Storage::url($path),
                'size' => $file->getSize(),
                'width' => $width,
                'height' => $height,
                'uploaded_by' => auth()->id(),
                'thumbnail_path' => $thumbnailPath,
                'thumbnail_url' => $thumbnailUrl,
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'media' => new MediaResource($mediaItems[0]),
                'media_items' => MediaResource::collection(collect($mediaItems)),
                'count' => count($mediaItems),
            ]);
        }

        return redirect()->route('media-library.media.index')
            ->with('success', count($mediaItems) > 1 ? 'Media files uploaded successfully.' : 'Media uploaded successfully.');
    }

    public function show(Media $medium): MediaResource
    {
        return new MediaResource($medium);
    }

    public function update(Request $request, Media $medium): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
        ]);

        $medium->update($validated);

        return redirect()->route('media-library.media.index')
            ->with('success', 'Media updated successfully.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        $this->deleteFiles($medium);
        $medium->delete();

        return redirect()->route('media-library.media.index')
            ->with('success', 'Media deleted successfully.');
    }

    public function destroyMultiple(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:media,id'],
        ]);

        $media = Media::whereIn('id', $request->ids)->get();
        $ids = $media->pluck('id');

        DB::transaction(function () use ($media, $ids) {
            Media::whereIn('id', $ids)->delete();

            foreach ($media as $item) {
                $this->deleteFiles($item);
            }
        });

        return redirect()->route('media-library.media.index')
            ->with('success', 'Selected media deleted successfully.');
    }

    private function deleteFiles(Media $medium): void
    {
        Storage::disk('public')->delete($medium->path);

        foreach (['thumbnail_path', 'medium_path', 'large_path', 'webp_path'] as $variant) {
            if ($medium->{$variant}) {
                Storage::disk('public')->delete($medium->{$variant});
            }
        }
    }


}
