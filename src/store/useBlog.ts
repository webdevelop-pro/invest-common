import { ref } from 'vue';

import { fetchGetAllBlogPosts, fetchGetOneBlogPost } from 'InvestCommon/services';
import { IPostContent } from 'InvestCommon/types/api/blog';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useBlogStore = defineStore('blog', () => {
  const isGetAllBlogPostsLoading = ref<boolean>(false);
  const isGetAllBlogPostsError = ref<boolean>(false);
  const getAllBlogPostsData = ref<IPostContent[]>();
  const getAllBlogPosts = async () => {
    isGetAllBlogPostsLoading.value = true;
    isGetAllBlogPostsError.value = false;
    const response = await fetchGetAllBlogPosts().catch(() => {
      isGetAllBlogPostsError.value = true;
    });
    if (response) getAllBlogPostsData.value = response;
    isGetAllBlogPostsLoading.value = false;
  };

  const isGetOneBlogPostLoading = ref<boolean>(false);
  const isGetOneBlogPostError = ref<boolean>(false);
  const getOneBlogPostData = ref<IPostContent>();
  const getOneBlogPost = async (slug: string) => {
    isGetOneBlogPostLoading.value = true;
    isGetOneBlogPostError.value = false;
    const response = await fetchGetOneBlogPost(slug).catch(() => {
      isGetOneBlogPostError.value = true;
    });
    if (response) getOneBlogPostData.value = response;
    isGetOneBlogPostLoading.value = false;
  };

  return {
    isGetAllBlogPostsLoading,
    isGetOneBlogPostLoading,

    isGetAllBlogPostsError,
    isGetOneBlogPostError,

    getAllBlogPostsData,
    getOneBlogPostData,

    getAllBlogPosts,
    getOneBlogPost,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBlogStore, import.meta.hot));
}
