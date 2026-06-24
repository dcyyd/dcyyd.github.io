import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AboutPage from './components/AboutPage.vue'
import HomePage from './components/HomePage.vue'
import PostPage from './components/PostPage.vue'
import TagPage from './components/TagPage.vue'
import BlogPage from './components/BlogPage.vue'
import ChangelogPage from './components/ChangelogPage.vue'
import FriendsPage from './components/FriendsPage.vue'
import ArchivePage from './components/ArchivePage.vue'
import CategoriesPage from './components/CategoriesPage.vue'
import CategoryPage from './components/CategoryPage.vue'
import NotFoundPage from './components/NotFoundPage.vue'
import CommentSection from './components/CommentSection.vue'
import AppLayout from './components/AppLayout.vue'
import './styles/fonts.css'
import './styles/index.css'
import 'katex/dist/katex.min.css'

export default {
  extends: DefaultTheme,
  Layout: AppLayout,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('PostPage', PostPage)
    app.component('TagPage', TagPage)
    app.component('AboutPage', AboutPage)
    app.component('BlogPage', BlogPage)
    app.component('ChangelogPage', ChangelogPage)
    app.component('FriendsPage', FriendsPage)
    app.component('ArchivePage', ArchivePage)
    app.component('CategoriesPage', CategoriesPage)
    app.component('CategoryPage', CategoryPage)
    app.component('NotFoundPage', NotFoundPage)
    app.component('CommentSection', CommentSection)
  }
} satisfies Theme
