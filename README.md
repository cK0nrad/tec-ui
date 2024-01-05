# TEC Live map

THIS IS NOT RELATED TO THE TEC (OTW) IN ANY WAY. THIS IS A PERSONAL PROJECT.

This is a live map of the TEC network. It is updated every 5 secondes.

[Live map demo](https://live.ckonrad.io/)

## Warning

This is an ongoing project and is not finished yet. 
Most of the work done here is going to be transfered to the backend.
The single page and the socket will be kept here but the processing of the data will be done on the backend. Thus, the spaghetti code will be removed. The inline css is also bad to read but easier to debug while it's in dev.

## Screenshots

![screenshot](https://raw.githubusercontent.com/cK0nrad/tec-ui/master/screenshot/live_map.png)


## How to use

```bash	
$ git clone https://github.com/cK0nrad/tec-ui
$ cd tec-ui
$ npm install
$ npm start
```

By default it run on port 3005

## Linked projects

- [tec-fetcher](https://github.com/cK0nrad/tec-fetcher) 
    - Used to fetch the data from the TEC API and transmit it to websockets
- [tec-ui](https://github.com/cK0nrad/tec-ui)
    - UI to display the data fetched by tec-fetcher and tec-gtfs
