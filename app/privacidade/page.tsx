import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updated="2026-11-v1">
      <section aria-labelledby="p-resumo">
        <h2 id="p-resumo">Em resumo</h2>
        <p className="mt-2">
          A Prevora <strong>guarda o problema, não a pessoa</strong>. Ela analisa pontos de descarte
          irregular, chuva e alagamentos para apoiar decisões da Prefeitura de Londrina. Não coleta
          nenhum dado de cidadãos e não abre chamados.
        </p>
      </section>

      <section aria-labelledby="p-dados">
        <h2 id="p-dados">Quais dados tratamos</h2>
        <ul>
          <li>
            <strong>Servidores públicos com acesso:</strong> nome, e-mail e cargo (cadastro) e a
            trilha de acesso (quem entrou, exportou ou apagou dados, e quando).
          </li>
          <li>
            <strong>Dados operacionais:</strong> localização aproximada de pontos e áreas, histórico
            de ocorrências, limpezas, chuva e decisões registradas. Não identificam pessoas.
          </li>
          <li>
            <strong>Logs técnicos:</strong> registros de funcionamento e de erros, com e-mails,
            nomes, senhas e tokens mascarados automaticamente.
          </li>
          <li>
            <strong>Fotos:</strong> o envio de fotos está fora desta versão. Se vier a existir,
            rostos e placas de veículos deverão ser desfocados antes do envio.
          </li>
        </ul>
      </section>

      <section aria-labelledby="p-base">
        <h2 id="p-base">Finalidade e base legal</h2>
        <p className="mt-2">
          Os dados de acesso servem para autenticar o servidor e proteger o sistema. A base legal é a
          execução de políticas públicas (LGPD, art. 7º, III) e o consentimento registrado no
          primeiro acesso. Os dados de cidadãos não são tratados.
        </p>
      </section>

      <section aria-labelledby="p-reten">
        <h2 id="p-reten">Por quanto tempo guardamos</h2>
        <ul>
          <li>Ocorrências: 5 anos.</li>
          <li>Logs de acesso e trilha de auditoria: 6 meses.</li>
          <li>Sessão de login: 8 horas.</li>
        </ul>
      </section>

      <section aria-labelledby="p-direitos">
        <h2 id="p-direitos">Seus direitos</h2>
        <p className="mt-2">
          Dentro do sistema, em <strong>Meus dados</strong>, você pode exportar seus dados em JSON e
          pedir a exclusão deles. O pedido é registrado e os dados guardados em memória são
          removidos; o cadastro de origem e a trilha de auditoria seguem a retenção acima.
        </p>
      </section>

      <section aria-labelledby="p-seg">
        <h2 id="p-seg">Segurança</h2>
        <p className="mt-2">
          Senhas com Argon2, sessão em cookie protegido (httpOnly, Secure, SameSite), conexão
          HTTPS, controle de acesso por perfil e limite de tentativas de login.
        </p>
      </section>

      <section aria-labelledby="p-contato">
        <h2 id="p-contato">Contato do encarregado (DPO)</h2>
        <p className="mt-2">[A DEFINIR pela Prefeitura de Londrina]</p>
      </section>
    </LegalPage>
  );
}
