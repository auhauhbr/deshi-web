# React + Vite

## Acessar pelo celular na rede local

Inicie o frontend e a API no computador. No celular, conectado à mesma rede Wi-Fi, abra o endereço de rede local exibido pelo Vite (por exemplo, `http://192.168.x.x:5173`). O frontend usa automaticamente o mesmo endereço do computador para chamar a API na porta `3030`, e a API permite origens locais do Vite.

Se o Windows Firewall perguntar, permita o acesso do Node.js à rede privada. Se o computador trocar de rede, use o novo endereço que o Vite exibir.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
