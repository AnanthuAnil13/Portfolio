# Portfolio

This repository contains two main parts:

- A static portfolio website for **Ananthu Anil** built with vanilla HTML, CSS, and JavaScript.
- A secondary Angular project under `worktab/` with server-side rendering and a Spring Boot backend.

---

## Repository structure

- `index.html` — home page for the portfolio.
- `about.html` — about/profile page that loads resume and experience data from `assets/resume.json`.
- `css/` — stylesheet for the static portfolio site.
- `js/` — front-end scripts, including site interaction logic and the 3D avatar viewer.
- `assets/` — static assets used by the portfolio, including `resume.json`, `resume.pdf`, and 3D avatar files.
- `worktab/` — Angular application with SSR support and its own `package.json`.
- `worktab/backend/` — Spring Boot backend built with Gradle.

---

## Static portfolio site

The root-level site is a self-contained portfolio experience:

- Animated landing page with a 3D avatar.
- Light/dark theme toggle.
- About page with resume, career timeline, and education details loaded dynamically from `assets/resume.json`.
- Resume modal that displays `assets/resume.pdf`.

### Running the static site

The static site can be opened directly from the file system, but the `about.html` page fetches JSON data, so using a local HTTP server is recommended:

```bash
cd /Users/ananthuanil/Documents/Work/Portfolio
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Alternatively, use any static server such as `npx serve .`.

---

## Worktab Angular project

The `worktab/` folder is an Angular application generated with Angular CLI 21.2.3 and configured for server-side rendering.

### Key files

- `worktab/package.json` — project scripts and dependencies.
- `worktab/angular.json` — Angular workspace configuration.
- `worktab/src/` — Angular application source.
- `worktab/public/` — static assets for the Angular app.
- `worktab/backend/` — Spring Boot backend module.

### Running the Angular app

```bash
cd /Users/ananthuanil/Documents/Work/Portfolio/worktab
npm install
npm start
```

Open the browser at:

```text
http://localhost:4200/
```

### Building the Angular app

```bash
npm run build
```

### Server-side rendering

```bash
npm run serve:ssr:worktab
```

### Tests

```bash
npm test
```

---

## Spring Boot backend

The backend lives in `worktab/backend` and uses:

- Spring Boot 4.0.4
- Spring Web, Data JPA, and Validation
- PostgreSQL runtime driver
- Java toolchain set to Java 25

### Running the backend

```bash
cd /Users/ananthuanil/Documents/Work/Portfolio/worktab/backend
./gradlew bootRun
```

Or build it with:

```bash
./gradlew build
```

Configuration files include `application.properties` and `application.yml` under `worktab/backend/src/main/resources`.

---

## Notes

- `worktab/` is a separate Angular subproject and may be developed independently from the root portfolio site.
- The root portfolio site is static and does not require a Node.js build step.
- If `about.html` does not load profile data, run the site through a local server instead of opening the file directly.
