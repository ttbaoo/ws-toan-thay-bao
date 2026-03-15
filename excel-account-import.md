# Excel Account Import & Custom Username Support

## Goal
Modify the authentication system to support custom usernames (making phone numbers optional), and build an admin tool to bulk-import student accounts via Excel, featuring auto-generated passwords and duplicate-skipping logic.

## Tasks
- [ ] Task 1: Update `database.sql` and run a migration script on the database.
  - Add `username VARCHAR(255) UNIQUE NULL` after `fullname`.
  - Modify `phone` to allow `NULL` values.
  → Verify: Database structure accepts `NULL` for phone and a new user can be inserted via CLI without a phone number.
- [ ] Task 2: Refactor `api/login.php` to handle both `phone` or `username`.
  - Change input mapping from `phone` to `identifier`.
  - Update SQL query to `WHERE phone = ? OR username = ?`.
  → Verify: Trying to log in with an admin's phone still works. Creating a test user with a `username` allows login using that `username`.
- [ ] Task 3: Refactor frontend Login/Register forms.
  - Change placeholder in `login.html` and `dang-ky.html` to say "Tên đăng nhập / Số điện thoại" Instead of just "Số điện thoại".
  - Update `api/register.php` logic so `phone` is optional and users can supply `username`.
  → Verify: A user can register organically via the UI using their `username`.
- [ ] Task 4: Install Excel library using Composer.
  - Run `composer require phpoffice/phpspreadsheet`.
  → Verify: `vendor/autoload.php` is generated and accessible.
- [ ] Task 5: Create `api/import-users.php`.
  - Accept `multipart/form-data` file upload.
  - Read mapping array for Excel headers.
  - Skip rows where the derived `username` or matched `phone` exists.
  - Auto-generate passwords, insert new records.
  - Return JSON array of `[Tên, Tên đăng nhập, Mật khẩu]`.
  → Verify: Endpoint processes an uploaded Excel file, safely ignores duplicates, and returns passwords.
- [ ] Task 6: Create Admin UI for "Import Students".
  - Add an import modal/section in the teacher dashboard.
  - Show upload button and download template button.
  - Display the returned JSON as a data table on success.
  - Add "Export Credentials to CSV" / "Copy Text" button for the teacher.
  → Verify: Teacher can select an Excel file, upload it, and immediately see the credentials to share.

## Done When
- [ ] `users` table uses `username` alongside optional `phone`.
- [ ] Teacher can upload an Excel class roster to generate missing accounts.
- [ ] Passwords for new accounts are auto-generated and shown exclusively to the teacher upon import.
- [ ] Imported students can log in.
- [ ] Duplicate rows or re-uploaded students are safely skipped without errors.
