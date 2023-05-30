import Head from 'next/head'
import Image from 'next/image'
import styles from '@/styles/Home.module.css'

export default function Home({formattedDate}) {
  return (
    <>
    <h1>Static Page</h1>
    <p>This page is static. It was build on {formattedDate}.</p>
    <p>
      <a href="/ssr">View a server-side rendered page.</a>
    </p>
    </>
  )
};

export async function getStaticProps(){
  const buildDate = Date.now();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "long"
  }).format(buildDate);
  return { props: { formattedDate } };
};
