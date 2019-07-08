# Project Title

Application for 3D visualization of geospatial data using Cesiumjs to achieve the following tasks:

1. To visualize different air quality parameters like dust,pollutants etc. on a Cesium globe rendered at user's choice of order.

2. Viewing thw wind currents at different altitudes depicting the velocity and direction of wind currents at different locations

3. Marking of regions using polylines and polygons and generating geojson format data of the marked figures.

# Description

## Why the shift to Cesiumjs?

Wind is an important element in studying the weather and climate, and it affects our daily lives in various ways. Analyzing wind is critical in many fields such as climate analysis and wind farm management. Visualizing it is crucial in being able to quickly understand the numerical wind data collected by measurement devices.

There are already some wind visualization applications, like Earth Nullschool and Windy, but unfortunately it seems that none of them can display the terrain, which is important for estimating the effect of wind on a specific location. Cesium, contains almost everything I need: 3D globe and terrain, Web Map Service layer display, and a powerful rendering engine. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installing

1. Install nodejs
Download the nodejs according to your system specifications from
https://nodejs.org/en/download/

Refer to this tutorial for more clarification
https://www.guru99.com/download-install-node-js.html#1

2. Install git

sudo apt install git

3. Install "Web Server for Chrome" a chrome extension to create a server  for our appliation from here 
https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en

### Installation of the project
1. Clone or download the repository.    
    '''bash
    git clone https://github.com/godswo123/IIRS_Internship
    '''
2. Change the directory to Cesium-3d-Wind
    cd Cesium-3d-Wind
3. Install the dependencies present in package.json
    npm install
4. Open "web server for chrome"
    Type in "web server for chrome" in the search box and open it.
    Choose the folder of the application.
    It creates a chrome server on its own and provides the link for the application.

### Sample run
1. Chose the folder "Cesium-3D-Wind" containing the index.html file 
    ![Choose](/Images/1.PNG?raw=true)

2. Now you reach this landing page
    ![HomePage](/Images/2.PNG?raw=true)

3. Click on the "Add Layers" button to open this modal. You can then choose the layer you want to display
    ![AddLayers](/Images/3.PNG?raw=true)

4. Now on exiting the modal you can see the wind layer displayed on the Cesium globe.
    ![Wind](/Images/4.PNG?raw=true)

5. You can view the different layers displayed and change their order and transparency from the toolbox provided
    ![Layers](/Images/5.PNG?raw=true)


