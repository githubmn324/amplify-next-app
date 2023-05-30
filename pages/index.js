import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify, API, Auth, withSSRContext } from 'aws-amplify';
import Head from 'next/head'
import awsExports from '@/src/aws-exports';
import { createPost } from '@/src/graphql/mutations';
import { listPosts } from '@/src/graphql/queries';
import styles from '@/styles/Home.module.css'

Amplify.configure({...awsExports, ssr: true}) // 後続のリクエストにて資格情報を利用可能とする設定

export async function getServerSideProps({ req }) {
  // 各リクエストに対して、Amplifyのコピー（資格情報、データ、ストレージ）を作成
  const SSR = withSSRContext({ req });  
  try {
    const response = await SSR.API.graphql({ query: listPosts, authMode: 'API_KEY' })
    return {
      props: {
        posts: response.data.listPosts.items,
      }
    }
  }catch(err){
    console.log(err);
    return {
      props: {},
    };
  };
}

async function handleCreatePost(event) {
  
  event.preventDefault();

  const form = new FormData(event.target);
  try {
    const { data } = await API.graphql({
      authMode: 'AMAZON_COGNITO_USER_POOLS',
      query: createPost,
      variables: {
        input: {
          title: form.get('title'),
          content: form.get('content')
        }
      }
    });
    // リダイレクト先の設定
    window.location.href = `/posts/${data.createPost.id}`;
  } catch ({ errors }) {
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

export default function Home({ posts = [] }) {
  return (
    
    <div className={styles.container}>
      <Head>
        <title>Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Amplify + Next.js</h1>

        <p className={styles.description}>
          <code className={styles.code}>{posts.length}</code>
          posts
        </p>

        <div className={styles.grid}>
          {posts.map((post) => (
            <a className={styles.card} href={`/posts/${post.id}`} key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </a>
          ))}

          <div className={styles.card}>
            <h3 className={styles.title}>New Post</h3>

            <Authenticator>
              <form onSubmit={handleCreatePost}>
                <fieldset>
                  <legend>Title</legend>
                  <input
                    defaultValue={`Today, ${new Date().toLocaleTimeString()}`}
                    name="title"
                  />
                </fieldset>

                <fieldset>
                  <legend>Content</legend>
                  <textarea
                    defaultValue="I built an Amplify project with Next.js!"
                    name="content"
                  />
                </fieldset>

                <button>Create Post</button>
                <button type="button" onClick={() => Auth.signOut()}>
                  Sign out
                </button>
              </form>
            </Authenticator>
          </div>
        </div>
      </main>
    </div>
  )
};

// export async function getStaticProps(){
//   const buildDate = Date.now();
//   const formattedDate = new Intl.DateTimeFormat("en-US", {
//     dateStyle: "long",
//     timeStyle: "long"
//   }).format(buildDate);
//   return { props: { formattedDate } };
// };
