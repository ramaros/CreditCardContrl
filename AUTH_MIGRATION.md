# Autenticação Firebase — preparação para publicação

Esta branch não é publicada automaticamente. **Não faça merge em main antes de testar.**

## O que foi implementado
- Cadastro, login, recuperação de senha e observação da sessão Firebase.
- Acesso ao aplicativo apenas após login.
- Operações Firestore em `users/{uid}/cards` e `users/{uid}/purchases`.
- Cache separado por UID no navegador.
- Importação **manual e explícita** dos dados legados deste navegador; nenhum registro legado é excluído.
- Exportação e importação de JSON e botão para sair.
- Regras Firestore propostas em `firestore.rules`.

## Configuração necessária no Firebase Console
1. Authentication > Sign-in method: habilitar Email/Password.
2. Authentication > Settings > Authorized domains: verificar o domínio de teste e `ramaros.github.io` antes de publicar.
3. Firestore Database > Rules: publicar o conteúdo de `firestore.rules` **somente após** a migração dos dados antigos e a validação do novo aplicativo. As regras do arquivo não são implantadas pelo commit.
4. Confirmar que as variáveis `VITE_FIREBASE_*` do build estão configuradas.

## Migração de dados
O aplicativo antigo utiliza `users/{parcelacard_sync_id}`; o novo usa `users/{firebaseAuthUid}`. A nova versão **não acessa automaticamente** a pasta antiga na nuvem e não associa um syncId a uma identidade verificada.

No navegador onde os dados antigos ainda estão salvos, entre na nova conta, abra **Backup** e use **Importar dados antigos deste navegador**. Confira cartões e compras antes de utilizar a nova conta em outro dispositivo. Os dados da nuvem antiga que não estão presentes no navegador **não serão migrados por esse botão**: exigem uma migração administrativa autenticada e controlada, com verificação de titularidade, sem publicar regras amplas de acesso.

Não compartilhe arquivos de conta de serviço, senhas ou chaves privadas e não armazene credenciais administrativas no repositório.

## Verificação
`npm ci`, `npm run lint`, `npm run build`. A workflow `.github/workflows/validate-auth.yml` executa esses comandos na branch. Também testar login, logout, recuperação, sincronização e isolamento entre duas contas.

## Limitações importantes
- A versão antiga publicada continua usando as regras antigas e seu código de syncId.
- As regras atuais amplas `request.auth != null` não garantem isolamento por UID. Para uso seguro, publique as regras restritas ao colocar a nova versão em produção.
- Não publique a nova versão até conferir a migração e as regras no Firebase Console.
