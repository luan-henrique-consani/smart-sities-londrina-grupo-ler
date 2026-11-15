import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Termo de Consentimento" };

export default function TermsPage() {
  return (
    <LegalPage title="Termo de Consentimento" updated="2026-11-v1">
      <section aria-labelledby="t-quem">
        <h2 id="t-quem">Quem usa a Prevora</h2>
        <p className="mt-2">
          Este termo vale para servidores públicos com acesso à Prevora (Administrador, Gestor,
          Técnico de campo e Defesa Civil).
        </p>
      </section>

      <section aria-labelledby="t-aceite">
        <h2 id="t-aceite">Ao aceitar, você concorda que</h2>
        <ul>
          <li>
            a Prevora trate seu <strong>nome, e-mail e cargo</strong> para autenticar o acesso e
            controlar permissões por perfil;
          </li>
          <li>
            suas ações sensíveis (entrar, sair, exportar ou apagar dados) fiquem em uma{" "}
            <strong>trilha de auditoria</strong> por 6 meses;
          </li>
          <li>
            as <strong>decisões</strong> que você registrar sobre pontos fiquem associadas ao seu
            perfil, para rastreabilidade;
          </li>
          <li>
            os textos gerados por IA são <strong>sugestões</strong> e devem ser revisados antes do
            uso.
          </li>
        </ul>
      </section>

      <section aria-labelledby="t-uso">
        <h2 id="t-uso">Seus compromissos</h2>
        <ul>
          <li>Não compartilhar sua senha nem sua sessão.</li>
          <li>Não inserir dados pessoais de cidadãos nas anotações das decisões.</li>
          <li>Desfocar rostos e placas se, no futuro, anexar fotos.</li>
        </ul>
      </section>

      <section aria-labelledby="t-dir">
        <h2 id="t-dir">Seus direitos</h2>
        <p className="mt-2">
          Você pode exportar seus dados ou pedir a exclusão deles em <strong>Meus dados</strong>, a
          qualquer momento. Veja a Política de Privacidade para os detalhes.
        </p>
      </section>

      <section aria-labelledby="t-dados">
        <h2 id="t-dados">Aviso desta demonstração</h2>
        <p className="mt-2">
          Todos os dados exibidos são simulados e as coordenadas são aproximadas. O aceite fica
          registrado com data e versão deste termo.
        </p>
      </section>
    </LegalPage>
  );
}
