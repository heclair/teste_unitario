import request from "supertest";
import app from "../helpers/testApp";

export async function createUserAndLogin(
  username = `user_${Date.now()}`,
  password = "123456"
) {
  await request(app).post("/users").send({ username, password }).expect(201);
  const res = await request(app).post("/users/login").send({ username, password }).expect(200);
  const token = res.body?.data?.token;
  if (!token) throw new Error("Token não retornado no login");
  return { token, username, password };
}
