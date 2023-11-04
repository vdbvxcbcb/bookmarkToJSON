const fs = require('fs');
const { JSDOM } = require('jsdom');

const { AltBookmarkIcon, BookmarkIcon } = require('./constants.js');

// 将导出的 chrome 书签命名为 bookmarks.html 并读取
const bookmarkHtml = fs.readFileSync('bookmarks.html', 'utf-8');
const dom = new JSDOM(bookmarkHtml);
const document = dom.window.document;

function randomID() {
  return (Math.random().toString().substring(2, 15) + Date.now()).toString(36).substring(2, 15);
}

function parseBookmarkNode(node, id, parentId) {
  const bookmark = {};
  if (node.nodeName === 'A') {
    // 标签页
    bookmark.id = id;
    bookmark.parentId = parentId;
    bookmark.title = node.innerHTML;
    bookmark.url = node.getAttribute('href');
    if (node.getAttribute('icon') === null) {
      bookmark.icon = AltBookmarkIcon;
    } else {
      bookmark.icon = node.getAttribute('icon');
    }
  } else if (node.nodeName === 'H3') {
    // 嵌套的子书签文件夹
    bookmark.id = id;
    bookmark.parentId = parentId;
    bookmark.title = node.innerHTML;
    bookmark.icon = BookmarkIcon;
    bookmark.children = [];
    let sibling = node.nextSibling;
    while (sibling) {
      // 找到下一个 <DL> 标签  比如：<H3 ADD_DATE="1649141460" LAST_MODIFIED="1649332555" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>旁的<DL>
      if (sibling.nodeName === 'DL') {
        // <DL> 标签则加多一个 children 属性
        // 找到 <DL> 下每一个 <DT> 标签 ，每一个 <DT> 标签下获取 <A> 标签和 <H3>
        bookmark.children = parseBookmarkList(sibling, id);
        break;
      }
      sibling = sibling.nextSibling;
    }
  }
  return bookmark;
}

function parseBookmarkList(list, parentId) {
  const bookmarks = [];
  // 唯一的 DL 标签下的子元素
  const nodes = list.children;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // 子元素为 DT 则根据 DT 下是否有 children 做处理
    if (node.nodeName === 'DT') {
      const id = randomID()
      // node.firstChild 比如：<H3 ADD_DATE="1649141460" LAST_MODIFIED="1649332555" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
      const bookmarkNode = parseBookmarkNode(node.firstChild, id, parentId);

      bookmarks.push(bookmarkNode);
    }
  }
  return bookmarks;
}

function addLevelAndId(bookmarkNodes, level, parentId) {
  for (let i = 0; i < bookmarkNodes.length; i++) {
    const bookmarkNode = bookmarkNodes[i];
    bookmarkNode.level = level;
    bookmarkNode.parentId = parentId;
    if (bookmarkNode.children) {
      addLevelAndId(bookmarkNode.children, level + 1, bookmarkNode.id);
    }
  }
}

const bookmarks = document.querySelector('DL');
const bookmarkTree = parseBookmarkList(bookmarks, null);
addLevelAndId(bookmarkTree, 0, null);

const json = JSON.stringify(bookmarkTree, null, 2);
// 创建 bookmark.json
fs.writeFileSync('bookmark.json', json, 'utf8');