import { getStore } from "@netlify/blobs";

// This function is the shared "backend" for the menu:
// - GET  -> anyone (the menu page) can read the current menu data
// - POST -> only requests with the correct password (the admin panel) can save new menu data
//
// The data itself lives in Netlify Blobs (a simple built-in storage that comes
// free with every Netlify site — no external database needed).

export default async (req) => {
  const store = getStore("nepenthe-menu");

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method === "GET") {
    const data = await store.get("menu-data", { type: "json" });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", ...cors },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "بدنه درخواست نامعتبر است" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8", ...cors },
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(JSON.stringify({ ok: false, error: "رمز مدیریت روی سرور تنظیم نشده است" }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8", ...cors },
      });
    }
    if (body.password !== adminPassword) {
      return new Response(JSON.stringify({ ok: false, error: "رمز عبور اشتباه است" }), {
        status: 403,
        headers: { "content-type": "application/json; charset=utf-8", ...cors },
      });
    }

    if (!body.data || !body.data.categories || !body.data.products) {
      return new Response(JSON.stringify({ ok: false, error: "داده منو نامعتبر است" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8", ...cors },
      });
    }

    await store.setJSON("menu-data", body.data);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", ...cors },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: cors });
};

export const config = {
  path: "/.netlify/functions/menu",
};
