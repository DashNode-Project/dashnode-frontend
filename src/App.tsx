import React from 'react';
import { AppProvider, useApp } from './store';
import { Toast } from './components/ui';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Meetings from './pages/Meetings';
import Availability from './pages/Availability';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import About from './pages/About';
import MyTasks from './pages/MyTasks';
import UserManual from './pages/UserManual';

function Router() {
  const { state, dispatch } = useApp();
  const { nav, currentUser, toast } = state;

  // Route guard
  const publicPages = ['landing', 'login', 'about'];
  if (!currentUser && !publicPages.includes(nav.page)) {
    return <Login />;
  }

  const renderPage = () => {
    switch (nav.page) {
      case 'landing': return <Landing />;
      case 'about': return <About />;
      case 'login': return <Login />;
      case 'dashboard': return <Dashboard />;
      case 'users': return <Users />;
      case 'projects': return <Projects />;
      case 'project-workspace': return <ProjectWorkspace />;
      case 'meetings': return <Meetings />;
      case 'availability': return <Availability />;
      case 'profile': return <Profile />;
      case 'calendar': return <Calendar />;
      case 'my-tasks': return <MyTasks />;
      case 'user-manual': return <UserManual />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {renderPage()}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => dispatch({ type: 'HIDE_TOAST' })}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
