import { z } from "zod";

/** Validação do formulário de login (espelha as regras do backend). */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .max(254, "O e-mail é longo demais.")
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Informe um e-mail válido, como nome@orgao.gov.br."),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(128, "A senha é longa demais."),
});

export type LoginInput = z.infer<typeof loginSchema>;
