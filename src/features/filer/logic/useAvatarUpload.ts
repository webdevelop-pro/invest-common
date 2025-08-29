import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import env from 'InvestCommon/domain/config/env';

export function useAvatarUpload(props: any, emit: any) {
  const { FILER_URL } = env;
  const filerRepository = useRepositoryFiler();
  const { postSignurlState } = storeToRefs(filerRepository);

  const refFiles = ref<HTMLInputElement>();
  const filesUploadError = ref('');
  const imageFile = ref<File>();
  const isLoading = ref(false);

  const onUpload = async (file: File) => {
    const res = await filerRepository.uploadHandler(
      file,
      props.userId,
      'user',
      props.userId,
    );
    if (res) {
      emit('upload-id', postSignurlState.value.data?.meta?.id);
    }
  };

  const onClick = () => {
    refFiles.value?.click();
  };

  const onFileChange = async () => {
    isLoading.value = true;
    const fileList = refFiles.value?.files as FileList;
    const incomingFiles = Array.from(fileList);
    const maxAllowedSize = 10 * 1024 * 1024; // 10MB
    filesUploadError.value = '';

    incomingFiles.forEach((file: File) => {
      if (file.size >= maxAllowedSize) {
        filesUploadError.value = 'Please upload a smaller file size. Limit 10MB';
      }
    });
    if (filesUploadError.value) {
      isLoading.value = false;
      return;
    }
    [imageFile.value] = incomingFiles;
    await onUpload(imageFile.value);
    isLoading.value = false;
  };

  return {
    FILER_URL,
    refFiles,
    filesUploadError,
    imageFile,
    isLoading,
    onUpload,
    onClick,
    onFileChange,
  };
} 