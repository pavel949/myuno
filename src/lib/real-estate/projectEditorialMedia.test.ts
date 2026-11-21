import { describe, expect, it } from 'vitest';
import { projectEditorialImages, projectGalleryField, publicProjectMediaUrl, reorderProjectImages } from './projectEditorialMedia';

describe('public project media from existing fields', () => {
  it('uses the cover first, deduplicates and preserves the preferred gallery order', () => {
    const media = { cover_image: '/cover.jpg', gallery_urls: ['/second.jpg', '/cover.jpg', '/third.jpg'], images: ['/old.jpg'] };
    expect(projectGalleryField(media)).toBe('gallery_urls');
    expect(projectEditorialImages(media)).toEqual(['/cover.jpg', '/second.jpg', '/third.jpg']);
  });

  it('respects an intentionally empty gallery without modifying legacy images', () => {
    expect(projectGalleryField({ gallery_urls: [] })).toBe('gallery_urls');
    expect(projectEditorialImages({ gallery_urls: [], images: ['/legacy.jpg'] })).toEqual([]);
    expect(projectEditorialImages({ gallery_urls: null, images: ['/legacy.jpg'] })).toEqual(['/legacy.jpg']);
  });

  it('never adds dangerous external URL schemes or credentials', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,example', '//other/file', 'https://user:pass@example.com/a', '/\\other', 'https://example.com/a\nb', 'http://other/file']) {
      expect(publicProjectMediaUrl(value)).toBeNull();
    }
    expect(publicProjectMediaUrl(' https://www.youtube.com/watch?v=abcdefghijk ', 'video')).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(publicProjectMediaUrl('https://video.example/watch', 'video')).toBeNull();
    expect(publicProjectMediaUrl('https://www.youtube.com/watch?v=abcdefghijk&token=test', 'video')).toBeNull();
    expect(publicProjectMediaUrl('https://project.supabase.co/storage/v1/object/sign/project-documents/secret.png?token=test')).toBeNull();
    expect(publicProjectMediaUrl('https://project.supabase.co/storage/v1/object/public/property-images/private-import.jpg')).toBeNull();
    expect(publicProjectMediaUrl('https://project.supabase.co/storage/v1/object/public/vendor-uploads/owner/projects/photo.webp')).not.toBeNull();
  });

  it('moves only the intended photo and never mutates the original list', () => {
    const images = ['a', 'b', 'c'];
    expect(reorderProjectImages(images, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(reorderProjectImages(images, 1, 1)).toEqual(['a', 'c', 'b']);
    expect(reorderProjectImages(images, 0, -1)).toBe(images);
    expect(reorderProjectImages(images, 2, 1)).toBe(images);
    expect(images).toEqual(['a', 'b', 'c']);
  });
});
