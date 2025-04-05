## Faust Scrolls

This is a [Next.js](https://nextjs.org/) project for browsing academic papers.

## Getting Started

First, install the dependencies:

```bash
npm install
```

### Starting the Backend

The application requires the Python backend to be running. Navigate to the backend directory:

```bash
cd ../faust-scrolls-backend
```

Make sure you have the required Python packages installed:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Starting the Frontend

After starting the backend, return to the frontend directory and run the development server:

```bash
cd ../faust-scrolls
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Real-time Article Generation

The application supports real-time article generation with WebSocket communication:

1. Navigate to the "Add New Article" page
2. Click the "Generate Random Articles" button above the charts
3. Watch as new articles are generated on the backend and automatically update the charts in real-time

The backend uses WebSockets to stream generated articles directly to the client, providing a seamless real-time experience.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
