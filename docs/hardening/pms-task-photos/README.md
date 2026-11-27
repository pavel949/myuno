# Property task photos

The manager task list can save an assigned task and an optional JPG, PNG, or WebP photo on the device. The photo is uploaded to a private bucket when the connection returns. The task and the reference to the photo are then written together, subject to the task revision and existing task permissions. Pending files stay on the originating device until sync succeeds or the user dismisses an item that conflicted.

Before enabling the photo control, apply `forward.sql` to the intended isolated Supabase environment. Verify the assigned worker can upload, another authorized viewer can read only the attached photo, and an unrelated or anonymous user cannot read it. Check the real Storage API upload, interrupted upload, signed download, and offline reconnect with a test account. Set the frontend build variable `VITE_PMS_TASK_PHOTOS_ENABLED=true` only in an environment where these checks passed.

To roll back, disable the frontend flag and apply `rollback.sql`. Rollback closes client access and preserves the private files and task records.
