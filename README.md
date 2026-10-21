# Glassmark — beginner setup

Glassmark is a small website made with HTML, CSS, and JavaScript. It does not need a database or any extra libraries. Your bookmarks and settings are saved in the browser you use.

## 1. Open the project folder

Open this folder in your code editor:

`/home/zvr/Documents/Codex/2026-10-21/b`

If you use Visual Studio Code, choose **File → Open Folder…** and select the `b` folder.

## 2. Start the website

Open a terminal in the project folder (in VS Code: **Terminal → New Terminal**) and run:

```sh
npm start
```

Then open this address in your browser:

<http://localhost:4173>

If your computer says that `npm` is not installed, you can start the same simple web server directly with Python:

```sh
python3 -m http.server 4173
```

On Windows, the command may be:

```powershell
py -m http.server 4173
```

Keep the terminal open while using the site. To stop the server, click the terminal and press **Ctrl+C**.

## 3. Try the dashboard

- Click **Arrange** to move or resize dashboard cards. Click **Done** when you finish.
- Click **Customize** to try wallpaper themes, upload a wallpaper, change the column count, or add a widget.
- Use **Add bookmark** to save a website. Clicking a bookmark opens it in another tab.
- Add a quick note or start the focus timer. Changes save in this browser automatically.

## 4. Make your first code change

Open `src/style.css`. Near the beginning, look for the `body` rule. Try changing the background colors or a value such as `--gap:14px` to `--gap:20px`, then save the file and refresh the browser.

Three useful files:

- `index.html` is the page shell that loads the app.
- `src/main.js` creates the page and handles its behavior.
- `src/style.css` controls colors, spacing, layout, and mobile styling.

A good learning path is to change one small thing, save, refresh, and observe what changed. If the site is running in the terminal and you edit a file, the server keeps running; refresh the browser to see your changes.

## Publish it for free with GitHub Pages

GitHub Pages can host this static website for free from a public repository. The deployed page is public, but bookmarks you add in the browser are saved locally and are not sent to GitHub.

### Simplest route: upload from GitHub's website

1. Create a GitHub account if you do not already have one.
2. On GitHub.com, create a new repository named `glassmark`. For the free Pages setup, make it **Public**. Leave the options to add a README, `.gitignore`, or license unchecked because this project already has files.
3. Open the new repository. Select **Add file → Upload files**.
4. Drag `index.html`, `package.json`, and `README.md` from this project into the upload area. Drag the `src` folder there too. You can also use **choose your files**. Leave the `outputs` and `work` folders out; they are not needed to run the site.
5. At the bottom of the page, enter a short message such as `Add Glassmark dashboard`, then click **Commit changes**.
6. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select the `main` branch and `/(root)` folder, then click **Save**.
7. Wait for GitHub Pages to finish publishing. The Pages settings screen will show the site address, usually `https://YOUR-NAME.github.io/glassmark/`.

When you change the website later, upload the changed files through **Add file → Upload files** and commit them. GitHub Pages will publish the update automatically.
