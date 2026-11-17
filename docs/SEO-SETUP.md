# Search setup (after the domain move)

Telling Google and Bing that the new site exists. The site already carries everything they
read (titles, descriptions, sitemap, language links, structured data, `llms.txt`). These
steps are the parts only the owner of the domain can do. About 40 minutes in total.

Do them only after `https://lindrize.online` shows the new site.

## 1. Google Search Console (15 minutes)

1. Open https://search.google.com/search-console and sign in with your Google account.
2. Add property → choose **Domain** (the left box) → type `lindrize.online`.
3. Google shows a `TXT` record. Add it where your DNS is managed: Type `TXT`, Name `@`,
   Value as shown. This **adds** a record; it changes none of the email records. If a
   `google-site-verification` record already exists from the old site, the property may
   verify at once.
4. Press Verify (it can take a few minutes after adding the record).
5. Left menu → **Sitemaps** → type `https://lindrize.online/sitemap.xml` → Submit.
6. Top search box → paste `https://lindrize.online/` → **Request indexing**. Repeat for
   `https://lindrize.online/ar/`.

**Check:** Sitemaps shows "Success" within a day, with 82 discovered pages.

What to expect: the old site's pages drop out and the new ones appear over one to three
weeks. Under **Pages**, "Not found (404)" entries for old addresses are normal.

## 2. Bing Webmaster Tools (5 minutes)

Bing also feeds ChatGPT search and Copilot.

1. Open https://www.bing.com/webmasters and sign in.
2. Choose **Import from Google Search Console**. It copies the property and the sitemap.

**Check:** the site appears with its sitemap listed.

## 3. Google Business Profile (20 minutes, optional)

Worth doing only if you want Lindrize to appear for searches like "AI automation agency
Amman". Google verifies by video or post, which can take days.

1. Open https://business.google.com → Add business.
2. Name: `Lindrize`. Category: closest match to "Software company" or "Business management
   consultant".
3. Choose **service-area business** (no public address) with Amman, Jordan as the area,
   unless you have an office visitors can come to.
4. Phone: +962 78 553 6571. Website: `https://lindrize.online`.
5. Use the same name, phone and website as on the site, exactly. Mismatches weaken trust.

Reviews: ask real clients only, and ask every client, not just happy ones. This is Google's
policy and it is the site's own honesty rule.

## 4. One month later

In Search Console → **Performance**, look at the queries people used. If owners search with
words the site does not use, tell me: the page titles and descriptions are easy to adjust
(`docs/KEYWORDS.md` records the current ones).

## What is deliberately not done

- No Google Analytics or tag manager: visitor counting stays on your own server (Umami).
- No paid backlinks, no directory spam, no invented reviews.
