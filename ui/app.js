$(function() {
  // window.onload = (e) => {
  //   $("#container").hide();
  //   window.addEventListener("message", (event) => {
  //     let data = event.data;
  //     if (data !== undefined && data.type === "Inventory-UI") {
  //       if (data.display === true) {
  //         $("#container").show();
  //         console.log("heya")
  //       } else {
  //         $("#container").hide();
  //       }
  //     }
  //   });
  // }

  // document.onkeyup = function (data) {
  //   if (data.which == 27) {
  //     $.post("http://xgc-inventory/closeInventory", JSON.stringify({}));
  //     console.log("hehe")
  //   }
  // };

  var dragDestIndex;
  var draggedEl;
  var draggedElIndex;
  var rearranging = false;
  var rearrangingDuration = 350;
  var draggableElArr = $('.draggable');

  // Update the CSS for each item to be in its correct location based on the order in the array passed
  // @param itemEls: the DOM elements, in order, from top left, row by row
  // @param columnsCount: the number of columns
  // @containerEl: the DOM element of the container for the arranged elements.
  function arrangeItems(itemEls, columnsCount, containerEl, elHeight) {
    var $containerEl = $(containerEl);

    // Set height of elements
    var elWidth = $containerEl.width() / columnsCount;
    elHeight = elHeight || elWidth;

    for (var i = 0; i < itemEls.length; i++) {
      var $item = $(itemEls[i]);
      $item.data('index', i);
      var pos = {
        x: (i % columnsCount),
        y: Math.floor(i / columnsCount)
      };

      $item.css({
        top: pos.y * elHeight + 'px',
        left: pos.x * elWidth + 'px',
        boxSizing: 'border-box'
      });
    }
  }

  // Rearrange the items in an array, returning a the modified array.
  // @param movedItemIndex: the index of the element being moved to a
  //   new position in the array
  // @param destinationIndex: the new index being given to the moved element
  function rearrangeItems(arr, movedItemIndex, destinationIndex) {
    var movedEl = arr.splice(movedItemIndex, 1)[0];
    arr.splice(destinationIndex, 0, movedEl);
    return arr;
  };

  arrangeItems(draggableElArr, 4, $('.content'));

  $('.draggable').on('dragstart', function (e) {
    draggedEl = $(this);
    var sortedArr = [];
    for (var i = 0; i < draggableElArr.length; i++) {
      var elIndex = $(draggableElArr[i]).data('index');
      sortedArr[elIndex] = draggableElArr[i];
    }
    draggableElArr = sortedArr;
    draggedElIndex = $(this).data('index');
    console.log('dragging element at position ', draggedElIndex);
    $(this).css({ opacity: 0, transition: 'all 100ms ease' });
  });

  $('.draggable').on('dragend', function (e) {
    e.preventDefault();
    $(this).css({ opacity: 1, transition: 'all 700ms ease' });
  });

  $('.draggable').on('dragover', function (e) {
    e.preventDefault();
    if (rearranging) {
      return;
    }
    var dragDestIndex = $(this).data('index');
    console.log('dragging over position ', dragDestIndex);
    draggedElIndex = draggedEl.data('index');
    if (draggedElIndex !== dragDestIndex) {
      rearranging = true;
      console.log('dragging element at position ', draggedElIndex, ' to new dest at position ', dragDestIndex);
      var rearrangedEls = rearrangeItems(draggableElArr, draggedElIndex, dragDestIndex);
      arrangeItems(rearrangedEls, 4, $('.content'));
      setTimeout(function () { rearranging = false }, rearrangingDuration);
    }
  });

  $('.draggable').on('drop', function (e) {
    e.preventDefault();
    rearranging = false;
  });
});