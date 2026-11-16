# Launch checklist

Everything that must be true before the domain moves (`docs/DNS-MOVE.md`). Tick each line.
Lines marked **(gate)** are also enforced by the "Launch check" on GitHub.

## Content

- [ ] Privacy Policy written in English and Arabic, and `ready` switched on **(gate)**
- [ ] Terms written in English and Arabic, and `ready` switched on **(gate)**
      (`docs/PRIVACY-TERMS-CHECKLIST.md` lists what each must cover)
- [ ] Arabic proofread by you, page by page, on a phone
- [ ] The 30 system pages and the FAQ answers read and corrected: nothing promised that you
      cannot deliver
- [ ] No placeholder or unfinished text anywhere **(gate)**
- [ ] The four demo chats tried on the real demo account, and the answers match the site
- [ ] Founding-client places per tier set in Settings, or left empty to hide the numbers

## Links (by hand, on your phone)

- [ ] "Book a call" opens your Calendly event
- [ ] The Calendly event has the question "Your agent design (filled in automatically)" as
      its first custom question, and a design made on the site appears in it
- [ ] The WhatsApp button opens a chat with +962 78 553 6571 and the message is pre-filled
- [ ] The `@darb_alyasmeen` link opens the demo profile
- [ ] "Message @darb_alyasmeen on Instagram" opens a chat with the demo account

## Server (`docs/SERVER-SETUP.md`)

- [ ] Steps 1 to 13 done, each check passed
- [ ] The site on `https://new.lindrize.online` matches the preview, English and Arabic
- [ ] "Email me my design": your copy and the visitor's copy arrive, not in spam
- [ ] The Telegram alert arrives (if set up)
- [ ] The Umami password is no longer the default
- [ ] A backup file exists in `/srv/lindrize/backups/`
- [ ] Undo tried once: `HOW-TO-EDIT.md` → "Undo"

## Checks

- [ ] GitHub → Actions → **Check**: green on the newest change
- [ ] GitHub → Actions → **Launch check** → Run workflow: green **(gate)**
- [ ] GitHub → Actions → **Outside links** → Run workflow: Calendly and WhatsApp green

## After the move (same week)

- [ ] `docs/DNS-MOVE.md` step 6
- [ ] `docs/SEO-SETUP.md`
- [ ] https://search.google.com/test/rich-results on the home page and one system page: no errors
- [ ] https://securityheaders.com on `www.lindrize.online`: send me the grade (A is expected)
- [ ] https://www.ssllabs.com/ssltest/ on `www.lindrize.online`: send me the grade (A is expected)
- [ ] A screen reader pass (VoiceOver, TalkBack or NVDA) on Home and "Design your agent", in both languages
