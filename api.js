/**
 * Cloudflare Pages Function
 * File này để trong thư mục /functions/ của project plong.pages.dev
 * URL: https://plong.pages.dev/api/clean
 * 
 * cron-job.org sẽ gọi URL này lúc 00:00 mỗi ngày tự động
 */

const FIREBASE_URL = "https://zewfakelag-default-rtdb.asia-southeast1.firebasedatabase.app";
const SECRET_KEY   = "zew2026secret69"; // Đổi thành mật khẩu bí mật của bạn

export async function onRequest(context) {
    const url    = new URL(context.request.url);
    const secret = url.searchParams.get("key");

    // Kiểm tra secret key để tránh người lạ gọi
    if (secret !== SECRET_KEY) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Lấy toàn bộ DB
        const res = await fetch(`${FIREBASE_URL}/.json`);
        const db  = await res.json();

        if (!db) return new Response("DB trống", { status: 200 });

        const validKeys      = db.ValidKeys      || {};
        const activatedUsers = db.ActivatedUsers || {};

        // Key nào đã được kích hoạt bởi user thường
        const activatedKeySet = new Set(
            Object.values(activatedUsers)
                .filter(u => typeof u === "object" && u.VIP !== true && u.Key)
                .map(u => u.Key)
        );

        let deleted = 0;
        const tasks = [];

        for (const [keyName, val] of Object.entries(validKeys)) {
            if (typeof val === "object" && val.VIP === true) continue; // Giữ Custom key
            if (!activatedKeySet.has(keyName)) continue;               // Giữ key chưa dùng

            tasks.push(
                fetch(`${FIREBASE_URL}/ValidKeys/${encodeURIComponent(keyName)}.json`, {
                    method: "DELETE"
                })
            );
            deleted++;
        }

        await Promise.all(tasks);

        return new Response(
            JSON.stringify({ success: true, deleted, time: new Date().toISOString() }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (e) {
        return new Response(
            JSON.stringify({ success: false, error: e.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}