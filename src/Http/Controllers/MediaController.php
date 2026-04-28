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
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 40);

        if ($request->wantsJson()) {
            return response()->json([
                'media' => MediaResource::collection($media),
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

            $mediaItems[] = Media::create([
                'name' => $name,
                'original_name' => $file->getClientOriginalName(),
                'file_name' => basename($path),
                'mime_type' => $file->getMimeType(),
                'type' => $this->getFileType($file->getMimeType()),
                'path' => $path,
                'url' => Storage::url($path),
                'size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
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

        return redirect()->route('admin.media.index')
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

        return redirect()->route('admin.media.index')
            ->with('success', 'Media updated successfully.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        $this->deleteFiles($medium);
        $medium->delete();

        return redirect()->route('admin.media.index')
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

        return redirect()->route('admin.media.index')
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

    private function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        if (str_starts_with($mimeType, 'application/pdf') ||
            str_starts_with($mimeType, 'application/msword') ||
            str_starts_with($mimeType, 'application/vnd')) {
            return 'document';
        }

        return 'document';
    }
}
