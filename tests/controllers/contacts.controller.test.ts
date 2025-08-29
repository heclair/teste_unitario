import request from "supertest";
import app from "../helpers/testApp";
import { createUserAndLogin } from "../helpers/auth";

describe("Contacts – CRUD", () => {
  // CRIAÇÃO
  it("cria contato válido associado ao usuário autenticado (201)", async () => {
    const { token } = await createUserAndLogin();
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "John Doe", phone: "12999998888" }); // passa pela regex do validateBody
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contact.id).toBeDefined();
  });

  it("impede criação sem campo obrigatório (name ou phone) → 400 (validateBody)", async () => {
    const { token } = await createUserAndLogin();
    const r1 = await request(app).post("/contacts").set("Authorization", `Bearer ${token}`).send({ phone: "12988887777" });
    expect(r1.status).toBe(400);
    const r2 = await request(app).post("/contacts").set("Authorization", `Bearer ${token}`).send({ name: "AA" });
    expect(r2.status).toBe(400);
  });

  it("impede criação com name muito curto → 400", async () => {
    const { token } = await createUserAndLogin();
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A", phone: "12988887777" });
    expect(res.status).toBe(400);
  });

  it("impede criação com telefone inválido (regex) → 400", async () => {
    const { token } = await createUserAndLogin();
    const badPhones = ["abc", "123", "(12)34-567", "129999-999", "12-99999-9999x"];
    for (const phone of badPhones) {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "John Doe", phone });
      expect(res.status).toBe(400);
    }
  });

  // LISTAGEM
  it("lista somente os contatos do usuário autenticado no formato correto", async () => {
    const a = await createUserAndLogin();
    const b = await createUserAndLogin();

    await request(app).post("/contacts").set("Authorization", `Bearer ${a.token}`).send({ name: "A1", phone: "12911112222" }).expect(201);
    await request(app).post("/contacts").set("Authorization", `Bearer ${b.token}`).send({ name: "B1", phone: "12933334444" }).expect(201);

    const resA = await request(app).get("/contacts").set("Authorization", `Bearer ${a.token}`).expect(200);
    expect(Array.isArray(resA.body.data)).toBe(true);
    expect(resA.body.data).toHaveLength(1);
    expect(resA.body.data[0]).toEqual(expect.objectContaining({ name: "A1", phone: "12911112222" }));
  });

  // ATUALIZAÇÃO
  it("atualiza contato existente (200) e retorna 404 quando não existe", async () => {
    const { token } = await createUserAndLogin();
    const created = await request(app).post("/contacts").set("Authorization", `Bearer ${token}`).send({ name: "Edit Me", phone: "12955556666" }).expect(201);
    const id = created.body.data.contact.id;

    const upd = await request(app).put(`/contacts/${id}`).set("Authorization", `Bearer ${token}`).send({ name: "Edited", phone: "12955556666" });
    expect(upd.status).toBe(200);
    expect(upd.body.success).toBe(true);
    expect(upd.body.data).toEqual(expect.objectContaining({ name: "Edited", phone: "12955556666" }));

    const upd404 = await request(app).put(`/contacts/999999`).set("Authorization", `Bearer ${token}`).send({ name: "teste", phone: "12977778888" });
    expect(upd404.status).toBe(404);
  });

  // EXCLUSÃO
  it("deleta contato existente (200) e retorna 404 se não existir", async () => {
    const { token } = await createUserAndLogin();
    const created = await request(app).post("/contacts").set("Authorization", `Bearer ${token}`).send({ name: "To Delete", phone: "12900001111" }).expect(201);
    const id = created.body.data.contact.id;

    const del = await request(app).delete(`/contacts/${id}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200); // seu controller retorna 200 com mensagem
    expect(del.body.success).toBe(true);

    const del404 = await request(app).delete(`/contacts/${id}`).set("Authorization", `Bearer ${token}`);
    expect(del404.status).toBe(404);
  });
});
