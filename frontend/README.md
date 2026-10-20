# Focus

Focus is the React frontend for the YouTube Finder Django API.

## Run locally

From the project root, apply migrations and start the Django API:

```powershell
.\env\Scripts\python.exe .\YTFinder\manage.py migrate
.\env\Scripts\python.exe .\YTFinder\manage.py runserver
```

Set `YOUTUBE_API_KEY` in the project `.env` file to enable video search.

In another terminal, install and start the frontend:

```powershell
cd .\frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. In development, Vite proxies `/api`
requests to Django at `http://127.0.0.1:8000`. The deployed frontend must be
served from the same origin as the API or use an equivalent `/api` reverse
proxy.

Focus supports account creation and sign-in, video search, opening videos, and
a per-account watch history. The access and refresh tokens are stored in the
browser's local storage.
