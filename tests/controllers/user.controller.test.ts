import request from "supertest";
import crypto from "crypto";
import app from "../helpers/testApp";

describe("User – Registro/Login/Logout", () => {
  const valid = { username: "testeuser", password: "123456" };

  // REGISTRO
  it("cria usuário válido com sucesso", async () => {
    const res = await request(app).post("/users").send(valid);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Usuário criado com sucesso.");

    const check = await global.pool.query("SELECT * FROM users WHERE username=$1", [valid.username]);
    expect(check.rows).toHaveLength(1);
  });

  it("impede criação com username muito curto e password < 6 (validateBody → 400)", async () => {
    const a = await request(app).post("/users").send({ username: "ab", password: "123456" });
    expect(a.status).toBe(400);
    const b = await request(app).post("/users").send({ username: "abc", password: "123" });
    expect(b.status).toBe(400);
  });

  it("impede criação de usuário duplicado (unique)", async () => {
    await request(app).post("/users").send(valid).expect(201);
    const dup = await request(app).post("/users").send(valid);
    expect(dup.status).toBe(400);
    expect(dup.body.success).toBe(false);
  });

  // LOGIN
  it("permite login válido e retorna JWT", async () => {
    await request(app).post("/users").send(valid).expect(201);
    const res = await request(app).post("/users/login").send(valid);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it("bloqueia login com senha incorreta ou usuário inexistente (401)", async () => {
    await request(app).post("/users").send(valid).expect(201);
    const wrongPass = await request(app).post("/users/login").send({ username: valid.username, password: "999999" });
    expect(wrongPass.status).toBe(401);

    const noUser = await request(app).post("/users/login").send({ username: "naoexiste", password: "123456" });
    expect(noUser.status).toBe(401);
  });

  it("bloqueia login com campos ausentes (validateBody → 400)", async () => {
    const r1 = await request(app).post("/users/login").send({ username: "x" });
    expect(r1.status).toBe(400);
    const r2 = await request(app).post("/users/login").send({ password: "123456" });
    expect(r2.status).toBe(400);
    const r3 = await request(app).post("/users/login").send({});
    expect(r3.status).toBe(400);
  });

  // LOGOUT
  it("faz logout, invalida o token no Redis e bloqueia reuso do token", async () => {
    await request(app).post("/users").send(valid).expect(201);
    const login = await request(app).post("/users/login").send(valid).expect(200);
    const token = login.body.data.token as string;

    const logout = await request(app).post("/users/logout").set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(200);
    expect(logout.body.success).toBe(true);

    // token foi blacklisted?
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const blacklisted = await global.redis.get(`blacklist:jwt:${tokenHash}`);
    expect(blacklisted).toBe("true");

    // middleware deve rejeitar token já deslogado
    const blocked = await request(app).get("/contacts").set("Authorization", `Bearer ${token}`);
    expect(blocked.status).toBe(401);
    expect(blocked.body.success).toBe(false);
  });
});
