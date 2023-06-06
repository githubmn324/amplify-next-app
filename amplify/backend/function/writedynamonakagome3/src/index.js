import 'isomorphic-fetch';
import gql from 'graphql-tag';
import AWSAppSyncClient from 'aws-appsync';

// クエリ
const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      content
      createdAt
      updatedAt
      owner
    }
  }
`;
const query = gql(createPost);

// パラメータ
const params =  {
  'id': 'id' + Date.now(),
  'title': "test title: " + Date.now(),
  'content':  "test content: " + Date.now(),
  'owner': 'lambda',
  'createdAt': "2021-09-22T17:18:44.875Z",
  'updatedAt': "2021-09-22T17:18:44.875Z",
  '__typename': 'Post'
}

export const handler = async (event) => {

  const url = 'https://h37jrflhrnaxdc5pvx6eflyp7a.appsync-api.ap-northeast-1.amazonaws.com/graphql';
  const region = 'ap-northeast-1';
  const authType = 'API_KEY';
  const apiKey = 'da2-vbzgd6dte5bh7ksrwvqbe4kkmm';

  const appSyncClient = new AWSAppSyncClient({
    url: url,
    region: region,
    auth: {
      type: authType,
      apiKey: apiKey
    },
    disableOffline: true,
  });

  try {
    await appSyncClient.mutate({
      variables: params,
      mutation: query
    });
    console.log("success")
  } catch (err) {
    console.log(JSON.stringify(err));
  }
  
};