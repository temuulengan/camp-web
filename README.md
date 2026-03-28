# camp-web
Baga-Bayan Enkhiin Tuloo Camp

## Local preview (see how it looks)
You can preview the static site locally with a simple HTTP server:

```bash
python -m http.server 8000 --directory /home/runner/work/camp-web/camp-web
```

Then open:

```
http://localhost:8000/index.html
```

> If you use VS Code, the “Live Server” extension works as well (open `index.html`).

## Deployment (GitHub Pages)
This project is a static website, so GitHub Pages is the simplest deployment:

1. Commit and push your changes to GitHub.
2. Go to **Settings → Pages** in the repository.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select your default branch (e.g., `main`) and the root folder (`/`), then **Save**.
5. GitHub will provide a public URL; the site will appear there within a minute or two.

When you update the site, push the changes again—GitHub Pages will redeploy automatically.
