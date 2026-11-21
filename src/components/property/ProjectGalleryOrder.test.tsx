import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectGalleryOrder } from './ProjectGalleryOrder';

afterEach(cleanup);

describe('project gallery editorial controls', () => {
  it('provides native focusable reorder and cover buttons without submitting the project form', () => {
    const submit = vi.fn();
    const onChange = vi.fn();
    const onCover = vi.fn();
    render(
      <form onSubmit={event => { event.preventDefault(); submit(); }}>
        <ProjectGalleryOrder language="en" images={['/a.jpg', '/b.jpg']} cover="/a.jpg" onChange={onChange} onCover={onCover} />
      </form>,
    );

    expect(screen.getByRole('button', { name: 'Move earlier: Photo 1' })).toBeDisabled();
    const move = screen.getByRole('button', { name: 'Move later: Photo 1' });
    move.focus();
    expect(move).toHaveFocus();
    fireEvent.click(move);
    expect(onChange).toHaveBeenCalledWith(['/b.jpg', '/a.jpg']);
    expect(screen.getByRole('button', { name: 'Cover: Photo 1' })).toBeDisabled();
    const cover = screen.getByRole('button', { name: 'Set as cover: Photo 2' });
    cover.focus();
    expect(cover).toHaveFocus();
    fireEvent.click(cover);
    expect(onCover).toHaveBeenCalledWith('/b.jpg');
    expect(submit).not.toHaveBeenCalled();
  });
});
