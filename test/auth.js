const assert = require('assert');
const auth = require('../auth');

describe ('auth', function() {
    it('authenticates via token', async function() {
        const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImI0OWM1MDYyZDg5MGY1Y2U0NDllODkwYzg4ZThkZDk4YzRmZWUwYWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2NzYwNjg0MTAsImF1ZCI6IjY2NDEyNDAwNTc2MC1jNXJrOWFnOWVwdnNscmc1ODZhc2ljdTVmNWM0ZDJoNS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMjgwNzY3MzUwMTYyMzI4MDA2MyIsImVtYWlsIjoibXl0ZXhvbWFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF6cCI6IjY2NDEyNDAwNTc2MC1jNXJrOWFnOWVwdnNscmc1ODZhc2ljdTVmNWM0ZDJoNS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsIm5hbWUiOiJTZcOxb3IgUm93ZSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BRWRGVHA2N1o2TUhGcXJDM2RRU1dISXNlZUhFak1WZ2xuTW1qSWR1bXZoSXF3PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlNlw7FvciIsImZhbWlseV9uYW1lIjoiUm93ZSIsImlhdCI6MTY3NjA2ODcxMCwiZXhwIjoxNjc2MDcyMzEwLCJqdGkiOiIxMmNlYjliYTQyZDdiMmViYjc1OGZjYmVlYzVkODU0YjZiOTA0NWFlIn0.ye66EboWHhyPRzGbZuOZ8xIeR2niJknbTwmkJiY8WzM0F0jjTE3JBjWhZt05bR-iCmFSq34EYPgPJuqCtXUeDaCdaakQhTXq3PCYcu32rSES7P03S9ecmqwINHu6l4Pw2hGNc-DSxw8uryQgkoOpDK3t344xHvvZp47lPz7zyvOoYoTyWaqaLwyGvJi-WVLkazCUhOF6EPU9evuiUDDvOAhyygvjOSOOLszB0f-Xd_8QFMoNHhj5sS5_m-5cTto1LViEPL-rDnoVtEKoj_C8Dl5W-NjnOspupUV21g_WoCQbx9sdyVdn4pUa5S8_dmZtP3flkM2UgGa7mjUeOZhPTA";
        const user = await auth.authenticateToken(token);
        assert.ok(user, "No user returned.");
        assert.ok(user.spreadsheetId, "No spreadsheetId for user.");
        assert.ok(user.auth, "No auth for user.");
        assert.equal(user.email, 'mytexoma@gmail.com');
    });
});