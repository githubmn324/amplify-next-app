import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify, API, Auth, graphqlOperation, withSSRContext } from 'aws-amplify';
import Head from 'next/head'
import awsExports from '@/src/aws-exports';
import { createPost } from '@/src/graphql/mutations';
import { listPosts } from '@/src/graphql/queries';
import styles from '@/styles/Home.module.css'
import { useState, useEffect } from "react"
import { newOnCreatePost } from '@/src/graphql/subscriptions';

Amplify.configure({
  ...awsExports, 
  ssr: true
}) // 後続のリクエストにて資格情報を利用可能とする設定

// export async function getServerSideProps({ req }) {
//   // 各リクエストに対して、Amplifyのコピー（資格情報、データ、ストレージ）を作成
//   const SSR = withSSRContext({ req }); 
//   try {
//     // POSTテーブル
//     const response = await SSR.API.graphql({ query: listPosts, authMode: 'API_KEY' })
//     return {
//       props: {
//         posts: response.data.listPosts.items,
//       }
//     };
//   }catch(err){
//     console.log(err);
//     return {
//       props: {},
//     };
//   };
// };

// SSG (Static Site Generator) で現在のテーブル情報を取得して、プリレンダリングする。
export async function getStaticProps(){
  try{
    const response = await API.graphql({ 
      query: listPosts, authMode: 'API_KEY'
    })
    return { 
      props: { 
        posts: response.data.listPosts.items,
      }
    };
  }catch(err){
    console.log(err);
    return {
      props: {},
    };
  }
};

// タイムラインへ投稿する
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
    window.location.href = `/posts/${data.createPost.id}`;
  } catch ({ errors }) {
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

export default function Home({ posts = [] }) {
  const [currentUser, setCurrentUser] = useState("");
  const [updatedPostData, setUpdatedPostData] = useState("");
  const [dataToDisplay, setDataToDisplay] = useState(posts);
    
  // 画面表示する全ポストデータの取得
  async function getAllPostData(){
    console.log("最新データ取得開始。")
    const { data } = await API.graphql({
      // authMode: 'AMAZON_COGNITO_USER_POOLS',
      authMode: 'API_KEY',
      query: listPosts,
    });
    console.log("dataToDisplay更新")
    console.log({data: data.listPosts.items})
    console.log(data.listPosts.items.length)
    setDataToDisplay(data.listPosts.items);
  }
  // サブスクリプション検知したら実行
  useEffect(()=>{
    console.log("最新データ取得します。")
    getAllPostData();
  }, [updatedPostData])

  // サブスクリプションの設定
  let subscriptionOnCreate;
  function setupSubscriptions(){
    console.log("サブスクリプション開始")
    subscriptionOnCreate = API.graphql(
      graphqlOperation(newOnCreatePost)
    ).subscribe({
      next: (updatedPostData) => {
        alert(`${updatedPostData.value.data.newOnCreatePost.owner} uploaded the new data`);
        console.log({updatedPostData:updatedPostData})
        setUpdatedPostData(updatedPostData);
      },
    })
  };
  // 初回レンダリング時に実行
  useEffect(() => {
    // 画面に現在のログインユーザ情報を表示
    Auth.currentAuthenticatedUser()
      .then((result)=>setCurrentUser(result.username))
      .catch(()=> setCurrentUser(""));
    // サブスクリプションの開始
    setupSubscriptions();
    return () => {
      subscriptionOnCreate.unsubscribe();
    }
  });

  return (
    <div className={styles.container}>
      <Head>
        <title>Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Amplify + Next.js</h1>

        <p className={styles.description}>
          <code className={styles.code}>{dataToDisplay.length} posts</code>
        </p>

        <div className={styles.grid}>
          {dataToDisplay.map((post) => (
            <a className={styles.card} href={`/posts/${post.id}`} key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </a>
          ))}

          <div className={styles.card}>
            <h3 className={styles.title}>New Post by {currentUser}</h3>
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