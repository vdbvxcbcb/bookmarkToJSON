const fs = require('fs');

const bookmarkTree = fs.readFileSync('bookmark.json', 'utf8');

function findDataByTitle(data, title) {
  // 遍历数据数组
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    // 如果当前项的 title 和传入的 title 匹配，则返回当前项
    if (item.title === title) {
      return item;
    }
    // 如果当前项有 children，则递归查找该 title 的数据
    if (item.children && item.children.length > 0) {
      const result = findDataByTitle(item.children, title);
      // 如果找到了数据，则返回结果
      if (result) {
        return result;
      }
    }
  }
  // 如果遍历完整个数据数组都没有找到，则返回 null
  return null;
}

function findOneDataByTitle(data, title) {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.title === title) {
      const result = { ...item };
      if (item.children) {
        const childrenResult = [];
        item.children.forEach(child => {
          const childResult = findDataByTitle(data, child.title);
          if (childResult) {
            childrenResult.push(childResult);
          }
        });
        result.children = childrenResult;
      }
      return result;
    } else if (item.children) {
      const childResult = findDataByTitle(item.children, title);
      if (childResult) {
        return childResult;
      }
    }
  }
  return null;
}

function findDataByTitleArr(data, titleArr) {
  const result = [];
  for (let i = 0; i < titleArr.length; i++) {
    const title = titleArr[i];
    const item = findOneDataByTitle(data, title);
    if (item) {
      result.push(item);
    }
  }
  return result;
}

// 书签文件夹标题，根据标题从 bookmarks.json 中提取部分 json 数据
const titleArr = ['日报/周刊/月刊', '英文社区', '团队博客', '播客', '社区网站']
const data = findDataByTitleArr(JSON.parse(bookmarkTree), titleArr);
const json = JSON.stringify(data, null, 2);
fs.writeFileSync('partOfBookMark.json', json, 'utf8');