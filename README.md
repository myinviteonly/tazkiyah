# Tazkiyah 🦋

*"He has succeeded who purifies it." (Ash-Shams 91:9)*

A daily growth tracker for iPhone: salah, classes, workouts (your full 195 lb dumbbell plan), steps, character, a daily Quran or hadith reminder, a daily lesson on being a better partner, job applications and weigh-ins.

Marwa gets her own **live, read-only page** that updates every time you check something off. You can also send her a **summary card image** in one tap.

There is no money or Uber tracking anywhere in this app.

---

## What's inside

| File / folder | What it is |
|---|---|
| `index.html` | Your app (Today, Workout, Jobs, Progress, Settings) |
| `share.html` | Marwa's live view |
| `apps-script/Code.gs` | The Google Sheet script (you paste this into Google, **don't** rely on GitHub for it) |
| `js/config.js` | Your classes, term end date, workout plan. Edit here to change anything |
| `js/reminders.js` | 100 duas and reminders (Quran, Bukhari, Muslim) |
| `js/lessons.js` | 45 daily partner lessons |
| `assets/` | App icon and favicons |

---

## Part 1: Put the app on GitHub Pages (about 5 min, use a laptop)

1. Go to **github.com** and sign in as `danial-shaikh`.
2. Click **+** (top right) > **New repository**.
3. Name it `tazkiyah`. Set it to **Public** (free Pages needs public). Click **Create repository**.
4. On the next screen click **uploading an existing file**.
5. Unzip the zip I gave you. Open the `tazkiyah` folder and drag **everything inside it** into the upload box (the files *and* the `css`, `js`, `assets`, `apps-script` folders). Do not drag the outer folder itself.
6. Click **Commit changes**.
7. Go to **Settings** > **Pages** (left sidebar).
   Under **Build and deployment**: Source = **Deploy from a branch**, Branch = **main**, folder = **/ (root)**. Click **Save**.
8. Wait about 1 minute. Your app is live at:
   **https://danial-shaikh.github.io/tazkiyah/**

> Your data is **not** in the repo. The repo only holds the app's code, so it being public is fine.

---

## Part 2: Install it on your iPhone

1. On your iPhone, open **Safari** (must be Safari) and go to `https://danial-shaikh.github.io/tazkiyah/`
2. Tap the **Share** button (square with arrow).
3. Scroll and tap **Add to Home Screen**, then **Add**.
4. Open Tazkiyah from your home screen. It runs full screen like a normal app.

---

## Part 3: Create your keys (in the app, 30 seconds)

1. In the app, go to **Settings** > **1. Your keys** > tap **Generate keys**.
2. Tap **Copy for script**. This copies two lines that look like:
   ```js
   const WRITE_KEY = 'w_xxxxxxxx';
   const READ_KEY  = 'r_xxxxxxxx';
   ```
3. Paste them somewhere you can reach from your laptop (Notes with iCloud works, or email them to yourself).

---

## Part 4: Set up the Google Sheet + script (about 5 min, use a laptop)

1. Go to **sheets.google.com** and create a **Blank spreadsheet**. Name it `Tazkiyah`.
2. In the menu: **Extensions** > **Apps Script**. A code editor opens in a new tab.
3. Delete everything in the editor (the `function myFunction() {}` text).
4. Open `apps-script/Code.gs` from the zip, copy **all** of it, and paste it into the editor.
5. Near the top, find these two lines:
   ```js
   const WRITE_KEY = 'PASTE-WRITE-KEY-HERE';
   const READ_KEY  = 'PASTE-READ-KEY-HERE';
   ```
   Replace both lines with the two lines you copied in Part 3.
6. Click the **Save** icon (💾) or press Cmd/Ctrl + S.
7. **Give it permission once:**
   - In the toolbar, there is a dropdown that shows a function name. Pick **authorize**.
   - Click **Run**.
   - A popup says "Authorization required". Click **Review permissions**, choose your Google account.
   - You'll see **"Google hasn't verified this app"**. This is normal because you wrote it yourself. Click **Advanced** > **Go to Untitled project (unsafe)** > **Allow**.
   - Go back to your Sheet tab: you'll now see tabs called **Daily Log**, **Jobs** and **Weigh-ins**.
8. **Deploy it:**
   - Back in Apps Script, click the blue **Deploy** button (top right) > **New deployment**.
   - Click the gear ⚙️ next to "Select type" > choose **Web app**.
   - Description: `Tazkiyah`
   - **Execute as: Me**
   - **Who has access: Anyone** ← important. Her page can't read it otherwise. Your keys are what keep it private.
   - Click **Deploy**.
9. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy.../exec`. Send it to your phone the same way as before.

---

## Part 5: Connect the app

1. In the app: **Settings** > **2. Google Sheet connection**.
2. Paste the Web app URL and tap **Save & test**.
3. You should see "Connected" and butterflies. The pill at the top right turns green: **Synced**.
4. Open your Google Sheet: the **Daily Log** tab now shows today's row.

---

## Part 6: Send Marwa her link

1. In the app: **Settings** > **3. Marwa's live link** > **Send link** (or Copy).
2. She opens it in **Safari** on her iPhone, taps **Share** > **Add to Home Screen**.
3. Her page shows: today's score, salah, classes, workout, steps, protein, character checks, today's reminder and whether you read it, the day's lesson and whether you did it, this week's scores, every job application (company, role, remote/hybrid, status, plus the weekly count) and your weigh-ins (weight only).
4. It refreshes every minute and whenever she opens it. She can tap back through the last 10 days.

**Want to preview her page before setting anything up?** Open
`https://danial-shaikh.github.io/tazkiyah/share.html?demo=1`

---

## Daily use

- **Today tab:** tap to check off each prayer, mark classes Went or Cancelled, enter steps (copy the number from your iPhone's Health app), protein, character, reminder and lesson.
- **Workout tab:** log weight and reps for every set. It shows what you lifted last time and starts a rest timer when you tick a set. Weeks 1-2 automatically show only 2 sets (until Nov 3), then the full sets.
- **Jobs tab:** log each application. The search buttons open LinkedIn and Indeed already filtered to entry level, remote/hybrid, newest first.
- **Progress tab:** weigh-ins, your weight chart against the plan line, and this week's scores. Waist is optional and **never** leaves your phone.
- **Send today's card:** the button at the bottom of Today makes an image you can send her on iMessage or Snapchat.
- **Sleep reminder:** on nights before an 8:10 AM class, after 7 PM, the app reminds you to be in bed by 1 AM.

## Matching your masjid's prayer times

Settings > Prayer times. Choose the method closest to your masjid (ISNA is common in Toronto), switch Asr to Hanafi if your masjid uses it, then tap −1 / +1 on each prayer until the times match the masjid's timetable. Prayers are tracked as done / not done.

---

## Changing things later

- **Classes or term end date:** edit `js/config.js` on GitHub (open the file > pencil icon > edit > Commit). `termEnd` is set to `2026-12-04`; after that date no classes show.
- **Next semester:** replace the `classes` list in `js/config.js`.
- **After any code change:** open `service-worker.js` and bump `tazkiyah-v1` to `tazkiyah-v2` so phones pick up the update. Close and reopen the app twice.
- **If you edit Code.gs:** Deploy > **Manage deployments** > pencil ✏️ > Version: **New version** > Deploy. The URL stays the same.

## Troubleshooting

| Problem | Fix |
|---|---|
| Pill says **Not connected** | Finish Parts 3 to 5. |
| **Sync error: Invalid write key** | The keys in Code.gs don't match the app. Copy for script again, paste, save, then redeploy a New version. |
| **Keys not set in the script yet** | You forgot to replace the `PASTE-...` lines in Code.gs (Part 4 step 5). |
| Her page says **Could not load** | Check "Who has access" is **Anyone** in the deployment. |
| You made new keys | Paste the new lines into Code.gs, redeploy a New version, and send her the new link. Her old link stops working. |
| New phone or data cleared | Install again, paste your same keys and URL, then Settings > **Restore my data from the sheet**. |

## Privacy

- Your phone keeps everything first; the sheet is a copy in **your** Google account.
- Marwa's link can only **read**. It can't change anything.
- Her view gets the last 60 days, job company/role/type/status/date (not your links), and weight only.
- Waist never syncs. There is no money or Uber data anywhere.

---

*Prayer times: PrayTimes.org (LGPL). Hijri dates are calculated and may differ by a day from moon sighting. Reminders are from the Quran, Sahih al-Bukhari and Sahih Muslim (sunnah.com numbering); please check any text with a trusted source or your imam if something looks off.*
