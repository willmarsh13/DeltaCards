# Type Rating: Delta fleet flashcards

Flashcards for every jet type flying with a Delta tail: 17 mainline types plus 4 Delta Connection regionals (CRJ700, CRJ900, E170, E175).

## How to open it

The site is 4 plain files with no install or build step. You need an internet connection, because the photos load from Wikimedia Commons.

1. Get the folder. In this project's Library (or `/mnt/project-files/delta-flashcards/`), download all of these into one folder on your computer, e.g. `~/Downloads/delta-flashcards/`:
   `index.html`, `styles.css`, `app.js`, `data.js`
2. Double-click `index.html`. It opens in your default browser. That's it.

### Optional: run it as a local web server
Useful if you want to open it from your phone on the same Wi-Fi, or your browser is strict about local files.

```bash
cd ~/Downloads/delta-flashcards
python3 -m http.server 8080        # or: npx serve .
```
Then open http://localhost:8080. On your phone, open http://<your-computer's-LAN-IP>:8080.

### Optional: put it online
Drag the folder onto Netlify Drop (app.netlify.com/drop) or push it to a GitHub repo with GitHub Pages turned on. It's all static, so any static host works.

## Using it
- Click the card or press **Space** to flip.
- **C** toggles the cheats (what to look for). **P** shows another photo of the same type.
- **K** = got it, **J** = missed it. Missed cards come back a few cards later.
- **Quiz** mode (top right) gives 4 choices; press **1–4**.
- Filters: All / Mainline / Delta Connection / Narrowbody / Widebody / Airbus / Boeing.
- "Your weak spots" tracks your accuracy per type, saved in your browser.

## Updating the data
Everything lives in `data.js` (one entry per type: counts, seats, dates, cheats, facts, photos). Edit it and refresh.

## Data sources
- Mainline counts and seat configs: Delta Form 10-Q (Sept 30, 2026), via Wikipedia's Delta fleet table
- Regional counts: Delta News Hub media kits (Embraer, Apr 2025; Bombardier, Jan 2026). Operator splits from Wikipedia (Feb 2025).
- Example routes: Delta News Hub media kits
- Delivery history: Delta Flight Museum, plus Airbus, AeroTime, Simple Flying and AirlineGeeks for specific dates
- Photos: Wikimedia Commons, current Delta and Delta Connection airframes only, all CC BY / CC BY-SA / CC0 / public domain. Credits are on each card.

Fields marked "unconfirmed" in the app couldn't be verified from a primary source.
