import { Amplify, API, withSSRContext } from "aws-amplify";
import Head from 'next/head';
import awsExports from '@/aws-exports';
import { deletePost } from '@/graphql/mutations';
import { getPost } from '@/graphql/queries';
import styles from '../../styles/Home.module.css';

import { useRouter } from 'next/router';

Amplify.configure({...awsExports, ssr:true });

export async function getServerSideProps({req, params}){
    const SSR = withSSRContext({req});
    const {data} = await SSR.API.graphql({
        query: getPost,
        variables: {
            id: params.id
        }
    });
    console.log({
        method: "getServerSideProps",
        query: "getPost",
        data: data
        // data は以下のような内容が返ってくる。
        // getPost: {
        //     id: '0eaf16b5-6f8b-476b-b971-02147fe9c0f7',
        //     title: 'Today, 17:18:34',
        //     content: 'I built an Amplify project with Next.js!',
        //     createdAt: '2023-05-30T08:25:16.594Z',
        //     updatedAt: '2023-05-30T08:25:16.594Z',
        //     owner: 'nakagome'
        // }
        // }
    })
    return {
        props: {
            post: data.getPost
        }
    }
}

export default function Post({ post }) {
    const router = useRouter();

    if (router.isFallback) {
        return (
          <div className={styles.container}>
            <h1 className={styles.title}>Loading&hellip;</h1>
          </div>
        );
    }

    async function handleDelete(){
        try {
            await API.graphql({
              authMode: 'AMAZON_COGNITO_USER_POOLS',
              query: deletePost,
              variables: {
                input: { id: post.id }
              }
            });
            // ホーム画面へリダイレクト
            window.location.href = '/';
        } catch ({ errors }) {
            console.error(...errors);
            throw new Error(errors[0].message);
        }   
    }
    return (
        <div className={styles.container}>
          <Head>
            <title>{post.title} – Amplify + Next.js</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
    
          <main className={styles.main}>
            <h1 className={styles.title}>{post.title}</h1>
    
            <p className={styles.description}>{post.content}</p>
          </main>
    
          <footer className={styles.footer}>
            <button onClick={handleDelete}>💥 Delete post</button>
          </footer>
        </div>
    );
}
