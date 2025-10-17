var onClickDownload = (e) => {
  document.querySelector('button.dccon-downloader').innerText = "다운로드중..."
  document.querySelector('button.dccon-downloader').setAttribute('disabled', "true")
  const title = document.querySelector('div.info_viewtxt h4.font_blue').innerText
  let list = Array.from(document.querySelectorAll('ul.dccon_list img'));
  var zip = new JSZip();

  const getExt = (char) => {
    if(char === '/') return 'jpg';
    if(char === 'i') return 'png';
    if(char === 'R') return 'gif';
    return 'png';
  }

  Promise.all(list.map((img, index) => {
    const fileName = img.alt || img.title || `image_${index}`;
    const imgSrc = img.src;

    return new Promise((resolve, reject) => {
      const newImg = new Image();
      newImg.crossOrigin = 'anonymous';

      newImg.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = newImg.naturalWidth || newImg.width;
        canvas.height = newImg.naturalHeight || newImg.height;

        ctx.drawImage(newImg, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error(`Failed to convert ${fileName}`));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            const ext = getExt(result.charAt(result.indexOf(',')+1));
            zip.file(`${fileName}.${ext}`, blob);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      newImg.onerror = () => reject(new Error(`Failed to load ${fileName}`));
      newImg.src = imgSrc;
    });
  }))
  .then(() => {
    return zip.generateAsync({type:"blob"});
  })
  .then((content) => {
    const zipUrl = URL.createObjectURL(content);
    document.querySelector('button.dccon-downloader').innerText = "다운받기"
    document.querySelector('button.dccon-downloader').setAttribute('disabled', "false")
    chrome.runtime.sendMessage({title, zipUrl});
  })
  .catch(e => {
    document.querySelector('button.dccon-downloader').innerText = "다운받기"
    document.querySelector('button.dccon-downloader').setAttribute('disabled', "false")
    alert('다운로드 실패: ' + e.message);
  });
}

function addDownloadButton() {
  if (document.querySelector('.dccon-downloader')) return;

  let purchase_button = document.querySelector('.btn_buy');
  if (!purchase_button) return;

  let download_button = document.createElement("button");
  download_button.setAttribute('type', 'button');
  download_button.setAttribute('class', 'btn_blue small dccon-downloader');
  download_button.onclick = onClickDownload;
  download_button.innerText = "다운받기";

  purchase_button.insertAdjacentElement("beforebegin", download_button);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addDownloadButton);
} else {
  addDownloadButton();
}

document.addEventListener("click", function(e) {
  if( (e.target.className !== 'btn_dccon_infoview div_package') &&
      (e.target.className !== 'dcon_frame blue_brd') &&
      (e.target.className !== 'dcon_frame red_brd') ) return;

  var observer = new MutationObserver(function (mutations, me) {
    let dccon_window = document.querySelector('.info_viewtxt');
    if (dccon_window) {
      addDownloadButton();
      me.disconnect();
      return;
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
}, false);

const globalObserver = new MutationObserver(() => {
  addDownloadButton();
});

globalObserver.observe(document.body, {
  childList: true,
  subtree: true
});