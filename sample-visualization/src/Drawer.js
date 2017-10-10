import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import FolderIcon from 'material-ui-icons/Folder';
import { Route, Link } from 'react-router-dom';
import Container from './Container';

const drawerWidth = 240;
const styles = theme => ({
  root: {
    width: '100%',
    // height: 430,
    height: '100vh',
    zIndex: 1,
    overflow: 'hidden',
  },
  appFrame: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  appBar: {
    position: 'absolute',
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    overflow: 'scroll',
  },
  drawerPaper: {
    position: 'relative',
    height: '100%',
    width: drawerWidth,
  },
  drawerHeader: theme.mixins.toolbar,
  content: {
    backgroundColor: theme.palette.background.default,
    width: '100%',
    padding: theme.spacing.unit * 3,
    height: 'calc(100% - 56px)',
    marginTop: 56,
    overflow: 'scroll',
    [theme.breakpoints.up('sm')]: {
      height: 'calc(100% - 64px)',
      marginTop: 64,
    },
  },
});

function PermanentDrawer(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <div className={classes.appFrame}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <Typography type="title" color="inherit" noWrap>
              Project Birds-Eye-View
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          type="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.drawerHeader} />
          <Divider />
          <List>
            {props.containers.map(container => (
              <Link to={`/container/${container.name}`} key={container.name}>
                <ListItem button>
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText primary={container.name} />
                </ListItem>
              </Link>
            ))}
          </List>
        </Drawer>
        <main className={classes.content}>
          <Route
            path="/container/:container([^\/]+)"
            render={({ match }) => {
              const container = props.containers.find(
                potential => potential.name === match.params.container,
              );
              return container ? (
                <Container
                  name={container.name}
                  lastModified={container.lastModified}
                  key={container.name}
                />
              ) : null;
            }}
          />
          <Route
            exact
            path="/"
            render={() => (
              <Paper
                elevation={4}
                style={{
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                }}
              >
                <Typography type="headline" component="h3">
                  Welcome to Birds Eye View!
                </Typography>
                <Typography type="body1" component="p">
                  Choose a container on the left sidebar
                </Typography>
                <Typography type="body1" component="p">
                  Happy Predicting!
                </Typography>
              </Paper>
            )}
          />
        </main>
      </div>
    </div>
  );
}

PermanentDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  containers: PropTypes.array,
};

PermanentDrawer.defaultProps = {
  containers: [],
};

export default withStyles(styles)(PermanentDrawer);
