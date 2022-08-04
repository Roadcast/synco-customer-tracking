/* tslint:disable:max-line-length*/
export const getRiderIconFace = () => {
  const iconList = [{
    icon: {
      path: `M11,0C4.9,0,0,4.9,0,11c0,2.9,1.1,5.5,2.9,7.4c0,0,0.1,
0.1,0.1,0.1c2,2.1,4.8,3.4,8,3.4c3.1,0,6-1.3,8-3.4
c0,0,0.1-0.1,0.1-0.1c1.8-2,2.9-4.6,2.9-7.4C22,4.9,17.1,0,11,0z`,
      scale: 1,
      fillColor: '#ffffff',
      fillOpacity: 1,
      rotation: 0,
      anchor: new google.maps.Point(11, 11),
      strokeOpacity: 0,
    },
    offset: '100%',
    fixedRotation: true,
  },
    {
      icon: {
        path: `M11,0C4.9,0,0,4.9,0,11c0,2.9,1.1,5.5,2.9,7.4c0,0,0.1,0.1,0.1,
0.1c2,2.1,4.8,3.4,8,3.4c3.1,0,6-1.3,8-3.4
c0,0,0.1-0.1,0.1-0.1c1.8-2,2.9-4.6,2.9-7.4C22,
4.9,17.1,0,11,0z M11,4.4c1.7,0,3.1,1.4,3.1,3.1s-1.4,3.1-3.1,3.1c-1.7,
0-3.1-1.4-3.1-3.1S9.3,4.4,11,4.4z M11,
20.6c-2.6,0-5-1.1-6.8-2.8C4.7,14.5,7.6,12,11,12c3.4,0,6.3,2.5,6.8,5.8
C16,19.6,13.6,20.6,11,20.6z`,
        scale: 1,
        fillColor: '#0D237D',
        fillOpacity: 1,
        rotation: 0,
        anchor: new google.maps.Point(11, 11),
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: true,
    }];
  return iconList;
};

export const getRiderIconBike = () => {
  const anchorPoint = new google.maps.Point(480, 480);
  const boxColor = '#41a9df';
  const shirtColor =  '#41a9df';
  const capColor =  '#c9171d';
  const bikeColor = '#ED3823';
  const iconScale = 0.075;
  const iconList = [
    {
      icon: {
        path: `M496.7,130.7c-12.3-8.9-24.6-8.9-36.9,0c-0.1-8.6-0.3-17.3-0.1-25.9c0.3-10,8.5-17.7,18.6-17.7
	s18.3,7.6,18.5,17.7C497.1,113.5,496.8,122.1,496.7,130.7z`,
        scale: iconScale,
        fillColor: '#282425',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M382.5,270.6c-3.9,0.6-7.9,1.2-11.9,1.8l-0.1,0c-5,5.6-12.3,5.5-18.9,7.3l-47,10.6c-2.9,0.6-5.8,1.3-8.7,1.9
	c-5.2,1-10-1.9-11.2-6.6c-1.4-5.1,1.3-10,6.6-11.6c3.4-0.9,6.8-1.4,10.2-2.2l44.3-10c3.6-0.8,7.1-1.6,10.7-2.4
	c-2.2-6.1-6-8.5-12.9-6.9c-12.8,2.9-25.4,6.4-38.2,9.6c-1.8,0.4-3.5,1-5.3,1.4c-1.5,0.3-3.2,0.5-3.7-1.4c-0.6-2.2,1-2.9,2.7-3.4
	c4.7-1.2,9.3-2.4,14-3.6c9.2-2.4,18.3-4.8,27.5-7.1c9.7-2.4,15.3,0,20.4,8.6c1.7,2.9,4.9,2.9,7.5,3.9l0.1,0c9.9-2.6,19.8-5,30-6
	l160.9-0.9c0.7-0.1,1.4-0.1,2-0.2c8.9,2,17.8,3.9,26.7,5.9c1.3,0.4,2.4,0.9,3.4,1.2h0.1c3.7-1,6.6-2.6,8.7-6.4
	c3.7-6.8,10.4-8.1,17.4-6.5c14.4,3.4,28.7,7.3,43,10.9c1.7,0.4,3.5,1.1,2.9,3.3c-0.7,2.4-2.8,1.8-4.6,1.3c-13.3-3.5-26.7-7-40-10.4
	c-5-1.3-9.9-1.8-13.8,2.7c-1.9,2.1-2.5,3.9,1.3,4.5c2.2,0.6,4.6,1.2,7.1,1.8l44.2,10.2c3.2,0.6,6.5,1.1,9.7,1.9
	c5.8,1.4,9,6.2,7.8,11.4c-1.2,5.2-6.1,8.1-11.9,7c-2.9-0.7-5.8-1.4-8.7-2l-47-10.6c-6.2-1.9-13.4-1.4-18.1-7.2h-0.1
	c-4.1-0.7-8.1-1.3-12.2-2L382.5,270.6z`,
        scale: iconScale,
        fillColor: '#353E44',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M550.3,657.6c-2.9,0-5.8,0-8.7,0c-31.3,0.1-62.6,0.1-93.9,0.2c-10.3,0-20.6-0.1-31-0.1c-2.8,0-5.4,0-8.2,0
	c0-13.3,0-26.6,0.1-39.9c0-7.2-2.6-221.9-2.9-258.3h-0.4c0-21.8,0-43.6,0-65.5c16.6-3,33.3-4.1,50.1-4.8c30.8-1.3,61.5-0.6,92,3.8
	c0,20.3,0,40.5,0,60.8l0.1,0C547.4,375,550.3,636.4,550.3,657.6z`,
        scale: iconScale,
        fillColor: '#353E44',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M362.5,449.5c12.5,12,25.6,23.3,39.9,33.2c1.5,1,2,2.4,2.3,4.1c4.6,28.9,9.4,57.8,13.7,86.8
	c0.9,6.1,3.6,10,8.4,13.3c13,8.8,27.6,12.3,42.9,13.4c15.9,1.1,31.7,0.6,46.9-4.6c3.5-1.2,6.8-2.6,10.1-4.3
	c8.7-4.4,13.8-10.5,15.1-21c3.6-27.9,8.6-55.6,12.9-83.4c0.3-1.7,0.7-3.2,2.2-4.2c13.4-9.1,25.5-19.8,37.5-30.6
	c0.8,5.3,0.4,10.6-1.1,15.8c-10,33.7-20,67.5-30,101.2c-2.2,7.3-6.1,13.6-10.7,19.6c-1.1,1.4-2.6,2.6-2.8,4.6
	c-3.9,1.1-5.8,4.4-8.3,7.2c-2.7,2-5.4,4-8.1,6c-0.3,0.1-0.7,0.1-1,0.2c-23.8,14.1-49.4,16.2-76.1,12c-11.3-1.8-21.7-5.8-31.7-11.2
	c-2.7-1.9-5.3-3.9-8-5.8c-2.8-2.4-5.5-4.7-8.3-7.1c-0.2,0-0.4,0-0.6,0c-15-17-18.4-38.9-24.7-59.6c-6.8-22.2-13.2-44.5-19.8-66.8
	C361.6,462,360.9,455.8,362.5,449.5z`,
        scale: iconScale,
        fillColor: '#613915',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M334.9,319.5c0.1,3.3,0.3,6.5,0.4,9.9c0.9,2.9,0.1,6.2,1.5,9c1,10.2,3.5,19.9,7.9,29.1h-0.1
	c-0.1,0.3,0,0.7,0.3,0.9c11.4,27.7,31.4,46.7,58.9,58.2c0.5,0.2,1.1,0.5,1.6,0.7c4.9,1.8,9.3,5.6,15.2,3.8c1.7,7.2,4.2,14,7.9,20.4
	c21.9,38.4,70.7,42.3,97.9,7.8c6.6-8.4,10.3-18.1,13.4-28.1c2.9,1.8,5.3-0.3,7.9-1.1c3.2-1.2,6.6-2.3,9.7-3.7
	c18.3-8.3,34.1-19.7,45.6-36.5c11-14.3,17.1-30.7,19.8-48.5c0.7-4,1-7.9,1.7-11.9c0.1-3.7,0.3-7.5,0.2-11.2c0.1-2.2,0.6-3.5,2.9-3.7
	c0,0,0.1,0,0.1,0c0.1-4.2-1.6-7.8-4.1-11.1c-1.3-3.1-4.3-3.2-7-4c-4.4-1.2-9.1-1.8-12.7-5.1c-4.2-3.8-3.4-9.7,1.8-11.9
	c1.5-0.7,2.1-1.4,2.1-2.8c2.9-5.7,3.4-12.1,5.9-17.9c2.9-2.2,5.8-2.3,9.3-1.3c9.6,2.6,19.2,4.8,28.8,6.9c2.8,0.6,4.8,2,6.1,4.5
	c0.8,2,0.8,4.1,0.3,6.2c-1.1,4.1-2.3,8.1-3.4,12.1c-0.3,1.1-0.7,2.2-1,3.3c-1,1.5-1.2,3.2-1.3,4.9c-1.9,3.1,0.4,6,0.3,9.1
	c0,1,0,2,0,3c4-0.8,4.2,0.8,4.9,5c0.4,2.9,0.5,5.9,0.4,8.8c-0.2,2-0.3,4-0.5,6c-0.3,2.3-0.7,4.6-1,6.9
	c-3.6,21.9-10.9,42.6-21.6,62.1c-9.1,16.2-20.3,30.7-32.3,44.4c-2.7,2.8-5.4,5.6-8.1,8.4c-12,10.8-24.1,21.5-37.5,30.6
	c-1.5,1-2,2.5-2.2,4.2c-4.4,27.8-9.3,55.5-12.9,83.4c-1.4,10.5-6.5,16.7-15.1,21c-3.3,1.6-6.7,3.1-10.1,4.3
	c-15.3,5.2-31.1,5.7-46.9,4.6c-15.3-1.1-29.9-4.6-42.9-13.4c-4.8-3.2-7.5-7.2-8.4-13.3c-4.3-29-9.1-57.9-13.7-86.8
	c-0.3-1.8-0.8-3.1-2.3-4.1c-14.3-9.8-27.4-21.2-39.9-33.2c-15.1-16-28.7-33.2-39-52.7c-11.9-22.8-19.9-46.6-21.5-72.4
	c-0.1-3.1,0-6.3-0.4-9.4c-0.5-4,0.9-5.5,4.8-4.4c1.4-6.9,2.1-13.8-1.9-20.2c0.3-1.9-0.6-3.5-1.1-5.2c-1.4-4.3-3-8.6-2-13.3
	c1.1-2.4,3.1-3.8,5.7-4.4c10.7-2.6,21.5-5.1,32.2-7.7c2.6-0.6,4.4,0.8,6.4,2c1.9,6,3.9,11.9,5.8,17.9c0,1.3,0.7,2,1.9,2.6
	c6.6,3.4,6.8,9.2,0.7,13.3c-2.5,1.7-5.4,2.7-8.3,3.1c-9.5,1-12.9,7.4-14.1,15.9C335.6,314.5,334.9,319.5,334.9,319.5z`,
        scale: iconScale,
        fillColor: '#FBC488',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M302.2,324.3c-0.1-3.1,0-6.3-0.4-9.4c-0.5-4,0.9-5.5,4.8-4.4c8.4,1.3,16.8,2.7,25.2,4c3.5,0.1,2.7,2.9,3.1,5
	c0.1,3.3,0.3,6.5,0.4,9.9l0,0c0.9,2.9,0.1,6.2,1.5,9c1,10.2,3.5,19.9,7.9,29.1h-0.1c-0.1,0.3,0,0.7,0.3,0.9
	c11.4,27.7,31.4,46.7,58.9,58.2c0.5,0.2,1.1,0.5,1.6,0.7c4.9,1.8,9.3,5.6,15.2,3.8c1.7,7.2,4.2,14,7.9,20.4
	c21.9,38.4,70.7,42.3,97.9,7.8c6.6-8.4,10.3-18.1,13.4-28.1c2.9,1.8,5.3-0.3,7.9-1.1c3.2-1.2,6.6-2.3,9.7-3.7
	c18.3-8.3,34.1-19.7,45.6-36.5c11-14.3,17.1-30.7,19.8-48.5c0.7-4,1-7.9,1.7-11.9l0,0c0.1-3.7,0.3-7.5,0.2-11.2
	c0.1-2.2,0.6-3.5,2.9-3.7c8.4-1.4,16.8-2.7,25.1-4.1c4.1-0.8,4.3,0.7,5,5c0.4,2.9,0.5,5.9,0.4,8.8c-0.2,2-0.3,4-0.5,6
	c-0.3,2.3-0.7,4.6-1,6.9c-3.6,21.9-10.9,42.6-21.6,62.1c-9.1,16.2-20.3,30.7-32.3,44.4c-2.7,2.8-5.4,5.6-8.1,8.4
	c-12,10.8-24.1,21.5-37.5,30.6c-1.5,1-2,2.5-2.2,4.2c-4.4,27.8-9.3,55.5-12.9,83.4c-1.4,10.5-6.5,16.7-15.1,21
	c-3.3,1.6-6.7,3.1-10.1,4.3c-15.3,5.2-31.1,5.7-46.9,4.6c-15.3-1.1-29.9-4.6-42.9-13.4c-4.8-3.2-7.5-7.2-8.4-13.3
	c-4.3-29-9.1-57.9-13.7-86.8c-0.3-1.8-0.8-3.1-2.3-4.1c-14.3-9.8-27.4-21.2-39.9-33.2c-15.1-16-28.7-33.2-39-52.7
	C311.8,373.9,303.8,350.1,302.2,324.3L302.2,324.3z`,
        scale: iconScale,
        fillColor: shirtColor,
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M540.4,406.6c-0.3-7.4-3.2-14.1-4.8-21.1c0-0.1-0.1-0.1-0.1-0.2c0.6-13.1-0.7-26.1-4.8-38.7
	c-4.6-14.5-13.8-24.5-29.1-27.9c-12.3-2.8-24.8-2.9-37.2-0.8c-17,3-28.7,12.5-34.7,28.8c-4.7,12.8-6.1,26.1-5.7,39.7h0.1
	c-2.6,7.9-5,15.7-5,24.1c-1.1,7,0.1,13.9,1.3,20.8c1.7,7.2,4.2,14,7.9,20.4c21.9,38.4,70.7,42.3,97.9,7.8
	c6.6-8.4,10.4-18.1,13.4-28.1C540.6,423.2,541.5,414.9,540.4,406.6`,
        scale: iconScale,
        fillColor: capColor,
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M586.9,734.5c0,35-0.1,70-0.1,104.9c0,20.9-12.3,33.2-33.2,33.2c-43.6,0-87.3,0-130.9,0c-2,0-4,0.1-6,0.2
	c-3.7-0.1-7.3-0.2-11-0.2c-19.7,0-32.6-12.7-32.7-32.4c-0.1-32.8,0-65.7,0-98.5c0-2.3-0.2-4.7-0.2-7c0.1-14.4,0.1-28.8,0.2-43.2
	c0.1-7.8,1.5-15.1,6.5-21.5c7.4-9.6,17.6-12.4,29-12.4c2.8,0,5.6,0,8.3,0c10.3,0.1,20.6,0.2,31,0.1c31.3,0,62.6-0.1,93.9-0.2
	c2.9,0,5.8,0,8.7,0c1.3,0.1,2.6,0.2,4,0.2c21.1-0.3,33.5,16.7,32.6,33C586.2,705.3,586.9,719.9,586.9,734.5z`,
        scale: iconScale,
        fillColor: boxColor,
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M594,303.1c-15.7-4.6-31-8.6-46.7-10.3c-30.5-4.4-61.2-5-92-3.8c-16.7,0.9-33.5,2-50,5
	c-2.2,0.4-4.6,0.2-6.7,1.3c-2.7,0-5.3,0.7-7.9,1.5c-8.5,1.4-16.6,4.1-24.8,6.6c0.2-1.5,0.6-3,0.8-4.5c1.1-2,2.2-3.7,3.3-5.7
	c0.3-0.3,0.3-0.6,0.2-1.1l-0.1-0.2h0c3-7.8,7.7-14.6,12.4-21.4c4.5-5.6,10.1-10,15.2-15.1c0.6-0.6,1.4-1.1,2.2-1.4
	c0.4-0.1,0.7-0.3,1.1-0.5c11.8-7.4,24.3-12.9,38-15.4l0.2,0.1c1.3-2-0.3-3.8-0.6-5.6c-1.2-7.2-2-14.3,1.1-21.2
	c2.3,5.4,6.5,7.9,11.3,9.3c0-20.9-0.2-57.3-0.1-70c0-7.9,3.8-14.3,9.1-19.9c12.3-8.9,24.6-8.9,36.9,0c3.3,3.5,5.9,7.4,7.9,11.8
	c2.3,10.8,0.8,21.8,1.1,32.6c0.2,5.1,0,32.2-0.1,46.4c5.7-1.1,11-3.5,14.9-8.9c3.7,6.9,2.1,14,0.8,21c-0.3,1.5-1.5,3-0.2,4.5
	c13.8,2.3,26.4,8.1,38.3,15.5c6.4,5.1,12.6,10.5,17.9,16.8c4.7,7.1,9.7,14,12.6,22.1c0.5,0.7,1,1.4,1.5,2.2
	C592.3,297.2,593,299.7,594,303.1z`,
        scale: iconScale,
        fillColor: bikeColor,
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M476.1,222.4c-7.8,0-14.2-0.4-20.1-1.3c-6.1-0.9-12.8-2.7-15.9-9.9c1.4-6,5.8-9.7,10.4-13.5l0.8-0.7
		c9-4.2,18.2-6.3,28.1-6.3c8.3,0,16.9,1.4,26.2,4.4c0.7,0.5,1.3,0.9,2,1.4c3.9,2.6,7.9,5.3,10.3,9.6c0.2,0.4,0.4,0.7,0.7,1.1
		c1,1.5,2,3.1,1.6,5.2c-5.7,8-14.8,9.3-22.9,9.5c-2.4,0.1-4.7,0.1-7.1,0.2C485.5,222.2,480.7,222.4,476.1,222.4
		C476.1,222.4,476.1,222.4,476.1,222.4z`,
        scale: iconScale,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },
    {
      icon: {
        path: `M479.4,191.2c8.2,0,16.7,1.4,26,4.4c0.7,0.5,1.3,0.9,2,1.3c4,2.7,7.8,5.2,10.1,9.5c0.2,0.4,0.4,0.7,0.7,1.1
		c1,1.5,1.9,2.9,1.6,4.7c-3.1,4.4-8.3,8.9-22.5,9.2c-2.4,0.1-4.7,0.1-7.1,0.2c-4.6,0.1-9.3,0.3-14,0.3c-7.8,0-14.2-0.4-20-1.3
		c-5.9-0.8-12.4-2.6-15.5-9.4c1.4-5.8,5.7-9.3,10.2-13.1l0.8-0.6C460.4,193.3,469.5,191.2,479.4,191.2 M479.4,190.2
		c-9.5,0-19,1.9-28.4,6.4c-4.9,4.1-10,8-11.5,14.7c3.1,7.1,9.4,9.3,16.4,10.3c6.7,1,13.4,1.3,20.2,1.3c7,0,14.1-0.3,21.1-0.5
		c8.8-0.2,17.7-1.7,23.4-9.8c0.6-2.8-1.2-4.8-2.3-6.7c-2.9-5.2-7.9-8-12.5-11.2C496.9,191.9,488.1,190.2,479.4,190.2L479.4,190.2z`,
        scale: iconScale,
        fillColor: '#ED3823',
        fillOpacity: 1,
        rotation: 0,
        anchor: anchorPoint,
        strokeOpacity: 0,
      },
      offset: '100%',
      fixedRotation: false,
    },

  ];
/*
  if (config.extraIcons && config.extraIcons.length) {
    config.extraIcons.forEach((element: { path: any; fillColor: any; }) => {
      iconList.push({
        icon: {
          path: element.path,
          scale: iconScale,
          fillColor: element.fillColor,
          fillOpacity: 1,
          rotation: 0,
          anchor: anchorPoint,
          strokeOpacity: 0,
        },
        offset: '100%',
        fixedRotation: false,
      });
    });
  }
*/
  return iconList;
};
