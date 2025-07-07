# ermis-chat-react-web

## Setup & Run Guide

### 1. Clone the source code

```sh
git clone https://github.com/ermisnetwork/ermis-chat-web-react
cd ermis-chat-web-react
```

### 2. Install dependencies

Using **npm**:

```sh
npm install
```

Or using **yarn**:

```sh
yarn install
```

### 3. Create environment configuration file

- Create a `.env.local` file in the project root directory.
- Copy all variables from the `.env.example` file (if available) into `.env.local`.
- Then, update the variable values to match your environment.

Example:

```sh
cp .env.example .env.local
```

### 4. Run the project

Using **npm**:

```sh
npm run dev
```

Or using **yarn**:

```sh
yarn dev
```

The app will run at [http://localhost:5511](http://localhost:5511) (or the port configured in `.env.local`).

---

## Additional Information

- To build for production:
  ```sh
  npm run build
  # or
  yarn build
  ```
- To lint the code with ESLint:
  ```sh
  npm run lint
  # or
  yarn lint
  ```
