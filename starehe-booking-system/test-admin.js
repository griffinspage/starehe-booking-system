const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const response = await fetch(
    `${url}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "testing123@example.com",
        password: "Password123!",
        email_confirm: true,
      }),
    }
  );

  console.log("STATUS:", response.status);

  const text = await response.text();
  console.log("BODY:");
  console.log(text);
}

test();