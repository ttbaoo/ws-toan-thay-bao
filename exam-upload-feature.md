# Exam Upload Feature

## Goal
Implement a secure feature for teachers to upload `.tex` exams. The system will parse the `.tex` file into Web format (HTML+Images), pre-compiling `tikzpicture` blocks locally using PHP `exec()`, and store everything in the database for students to take the exam online.

## Tasks
- [ ] Task 1: Update `database.sql` to add `exams`, `questions`, `choices`, and `exam_submissions` tables. → Verify: Tables created successfully via terminal.
- [ ] Task 2: Create strict server-side upload directories (`uploads/tex`, `uploads/images`) and a `.htaccess` file to prevent direct arbitrary execution. → Verify: Directories exist, `.htaccess` blocks PHP execution in uploads.
- [ ] Task 3: Build `api/upload-exam.php` to handle `.tex` file uploads, ensuring ONLY `admin`/`teacher` roles can access. → Verify: Uploading as student fails (403), teacher succeeds.
- [ ] Task 4: Implement a parsing class `TexParser.php` to read the `.tex` file, extract questions, choices (A/B/C/D), and identify `tikzpicture` blocks. → Verify: Unit test / manual test logs extracted structured data.
- [ ] Task 5: Implement secure local compilation: use `shell_exec` with `pdflatex` (shell-escape disabled) to compile individual TikZ blocks to PDF, then `pdftoppm` or `convert` to PNG. → Verify: Command executes safely and produces a `.png`.
- [ ] Task 6: Link the parsed content and generated image paths into the `questions` and `choices` database tables. → Verify: DB contains correct raw string data and paths to local images.
- [ ] Task 7: Build Teacher UI (`upload-exam.html` or similar frontend view) to submit the file. → Verify: Can select `.tex` file and see upload progress/success message.
- [ ] Task 8: Build Student UI (`take-exam.html` and `api/get-exam.php`) to fetch the DB representation and render it. → Verify: Web page shows questions with TikZ images, radio buttons for choices.
- [ ] Task 9: Build `api/submit-exam.php` to grade the student's submission. → Verify: Student submits exam and gets a correct score.

## Done When
- [ ] Teacher can upload a `<exam>.tex` file containing questions and TikZ block.
- [ ] The `.tex` file is parsed into database rows and images are compiled and stored on the server.
- [ ] Students can view the exam entirely in the browser (HTML + compiled images) and submit answers.
