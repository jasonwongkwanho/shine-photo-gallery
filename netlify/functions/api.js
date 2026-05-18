exports.handler = async function (event) {
  const gasUrl = process.env.GAS_WEBAPP_URL;
  const apiSecret = process.env.GAS_API_SECRET;

  if (!gasUrl || !apiSecret) {
    return json({ ok: false, error: "Missing GAS_WEBAPP_URL or GAS_API_SECRET" }, 500);
  }

  const input = event.queryStringParameters || {};
  const action = input.action || "albums";
  const params = new URLSearchParams();
  params.set("token", apiSecret);
  params.set("action", action);

  if (input.albumId) params.set("albumId", input.albumId);
  if (input.limit) params.set("limit", input.limit);

  try {
    const response = await fetch(gasUrl + "?" + params.toString());
    const text = await response.text();
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60"
      },
      body: text
    };
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};

function json(data, statusCode) {
  return {
    statusCode: statusCode || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(data)
  };
}
