export interface AsciiTableOptions {
  prefix?: string;
}

export interface AsciiData {
  title: string;
  heading: string[];
  rows: any[][];
}

export enum AsciiAlign {
  LEFT,
  CENTER,
  RIGHT,
}

export default class AsciiTable {
  options: AsciiTableOptions;

  private __name = "";
  private __nameAlign = AsciiAlign.CENTER;
  private __rows: any[] = [];
  private __maxCells = 0;
  private __aligns: number[] = [];
  private __colMaxes: any[] = [];
  private __rowMaxes: any[] = [];
  private __spacing = 1;
  private __heading: string[] | null = null;
  private __headingAlign = AsciiAlign.CENTER;

  private __border = true;
  private __edge = "|";
  private __fill = "-";
  private __top = ".";
  private __bottom = "'";

  private __justify = false;

  constructor(name?: string, options?: AsciiTableOptions) {
    this.options = options || {};
    this.reset(name);
  }

  static fromJSON(obj: AsciiData) {
    return new AsciiTable().parse(obj);
  }

  /**
   * Align the a string at the given length
   *
   * @param {Number} direction
   * @param {String} string input
   * @param {Number} string length
   * @param {Number} padding character
   * @api public
   */
  static align(dir: AsciiAlign, str: string, len: number, pad: string = "") {
    if (dir === AsciiAlign.LEFT) return AsciiTable.alignLeft(str, len, pad);
    if (dir === AsciiAlign.RIGHT) return AsciiTable.alignRight(str, len, pad);
    if (dir === AsciiAlign.CENTER) return AsciiTable.alignCenter(str, len, pad);
    return AsciiTable.alignAuto(str, len, pad);
  }

  /**
   * Left align a string by padding it at a given length
   *
   * @param {String} str
   * @param {Number} string length
   * @param {String} padding character (optional, default '')
   * @api public
   */
  static alignLeft(str: string, len: number, pad: string = "") {
    if (!len || len < 0) return "";
    if (str === undefined || str === null) str = "";
    if (typeof pad === "undefined") pad = " ";
    if (typeof str !== "string") str = String(str);
    var alen = len + 1 - str.length;
    if (alen <= 0) return str;
    return str + Array(len + 1 - str.length).join(pad);
  }

  /**
   * Center align a string by padding it at a given length
   *
   * @param {String} str
   * @param {Number} string length
   * @param {String} padding character (optional, default '')
   * @api public
   */
  static alignCenter(str: string, len: number, pad: string = "") {
    if (!len || len < 0) return "";
    if (str === undefined || str === null) str = "";
    if (typeof pad === "undefined") pad = " ";
    if (typeof str !== "string") str = String(str);
    var nLen = str.length,
      half = Math.floor(len / 2 - nLen / 2),
      odds = Math.abs((nLen % 2) - (len % 2)),
      len = str.length;

    return (
      AsciiTable.alignRight("", half, pad) +
      str +
      AsciiTable.alignLeft("", half + odds, pad)
    );
  }

  /**
   * Right align a string by padding it at a given length
   *
   * @param {String} str
   * @param {Number} string length
   * @param {String} padding character (optional, default '')
   * @api public
   */
  static alignRight(str: string, len: number, pad: string = "") {
    if (!len || len < 0) return "";
    if (str === undefined || str === null) str = "";
    if (typeof pad === "undefined") pad = " ";
    if (typeof str !== "string") str = String(str);
    var alen = len + 1 - str.length;
    if (alen <= 0) return str;
    return Array(len + 1 - str.length).join(pad) + str;
  }

  /**
   * Auto align string value based on object type
   *
   * @param {Any} object to string
   * @param {Number} string length
   * @param {String} padding character (optional, default '')
   * @api public
   */
  static alignAuto(str: any, len: number, pad: string = "") {
    if (str === undefined || str === null) str = "";
    var type = Object.prototype.toString.call(str);
    pad || (pad = " ");
    len = +len;
    if (type !== "[object String]") {
      str = str.toString();
    }
    if (str.length < len) {
      switch (type) {
        case "[object Number]":
          return AsciiTable.alignRight(str, len, pad);
        default:
          return AsciiTable.alignLeft(str, len, pad);
      }
    }
    return str;
  }

  /**
   * Fill an array at a given size with the given value
   *
   * @param {Number} array size
   * @param {Any} fill value
   * @return {Array} filled array
   * @api public
   */
  static arrayFill(len: number, fill: any) {
    var arr = new Array(len);
    for (var i = 0; i !== len; i++) {
      arr[i] = fill;
    }
    return arr;
  }

  reset(name?: string | AsciiData) {
    this.__name = "";
    this.__nameAlign = AsciiAlign.CENTER;
    this.__rows = [];
    this.__maxCells = 0;
    this.__aligns = [];
    this.__colMaxes = [];
    this.__spacing = 1;
    this.__heading = null;
    this.__headingAlign = AsciiAlign.CENTER;
    this.setBorder();

    if (Object.prototype.toString.call(name) === "[object String]") {
      this.__name = name as string;
    } else if (Object.prototype.toString.call(name) === "[object Object]") {
      this.parse(name as AsciiData);
    }
    return this;
  }

  clear(name = undefined) {
    return this.reset(name);
  }

  /**
   * Set the table border
   *
   * @param {String} horizontal edges (optional, default `|`)
   * @param {String} vertical edges (optional, default `-`)
   * @param {String} top corners (optional, default `.`)
   * @param {String} bottom corners (optional, default `'`)
   * @api public
   */
  setBorder(edge = "|", fill = "-", top = ".", bottom = "'") {
    this.__border = true;
    if (arguments.length === 1) {
      fill = top = bottom = edge;
    }
    this.__edge = edge || "|";
    this.__fill = fill || "-";
    this.__top = top || ".";
    this.__bottom = bottom || "'";
    return this;
  }

  /**
   * Remove all table borders
   *
   * @api public
   */
  removeBorder() {
    this.__border = false;
    this.__edge = " ";
    this.__fill = " ";
    return this;
  }

  /**
   * Set the column alignment at a given index
   *
   * @param {Number} column index
   * @param {Number} alignment direction
   * @api public
   */
  setAlign(idx: number, dir: number) {
    this.__aligns[idx] = dir;
    return this;
  }

  /**
   * Set the title of the table
   *
   * @param {String} title
   * @api public
   */
  setTitle(name: string) {
    this.__name = name;
    return this;
  }

  /**
   * Get the title of the table
   *
   * @return {String} title
   * @api public
   */
  getTitle() {
    return this.__name;
  }

  /**
   * Set table title alignment
   *
   * @param {Number} direction
   * @api public
   */
  setTitleAlign(dir: number) {
    this.__nameAlign = dir;
    return this;
  }

  /**
   * AsciiTable sorting shortcut to sort rows
   *
   * @param {Function} sorting method
   * @api public
   */
  sort(method: (a: any, b: any) => number) {
    this.__rows.sort(method);
    return this;
  }

  /**
   * Sort rows based on sort method for given column
   *
   * @param {Number} column index
   * @param {Function} sorting method
   * @api public
   */
  sortColumn(idx: number, method: Function) {
    this.__rows.sort(function (a, b) {
      return method(a[idx], b[idx]);
    });
    return this;
  }

  /**
   * Set table heading for columns
   *
   * @api public
   */
  setHeading(row: any[] | any, ...args: any[]) {
    if (
      args.length > 1 ||
      Object.prototype.toString.call(row) !== "[object Array]"
    ) {
      // row = Array.prototype.slice.call(arguments);
      row = [row].concat(args);
    }
    this.__heading = row;
    return this;
  }

  /**
   * Get table heading for columns
   *
   * @return {Array} copy of headings
   * @api public
   */
  getHeading() {
    return this.__heading ? this.__heading.slice() : [];
  }

  /**
   * Set heading alignment
   *
   * @param {Number} direction
   * @api public
   */
  setHeadingAlign(dir: AsciiAlign) {
    this.__headingAlign = dir;
    return this;
  }

  /**
   * Add a row of information to the table
   *
   * @param {...|Array} argument values in order of columns
   * @api public
   */
  addRow(row: any | any[], ...args: any[]) {
    if (
      args.length > 1 ||
      Object.prototype.toString.call(row) !== "[object Array]"
    ) {
      // row = Array.prototype.slice.call(arguments);
      row = [row].concat(args);
    }
    this.__maxCells = Math.max(this.__maxCells, row.length);
    this.__rows.push(row);
    return this;
  }

  /**
   * Get a copy of all rows of the table
   *
   * @return {Array} copy of rows
   * @api public
   */
  getRows() {
    return this.__rows.slice().map(function (row) {
      return row.slice();
    });
  }

  /**
   * Add rows in the format of a row matrix
   *
   * @param {Array} row matrix
   * @api public
   */
  addRowMatrix(rows: any[]) {
    for (var i = 0; i < rows.length; i++) {
      this.addRow(rows[i]);
    }
    return this;
  }

  /**
   * Add rows from the given data array, processed by the callback function rowCallback.
   *
   * @param {Array} data
   * @param (Function) rowCallback
   * @param (Boolean) asMatrix - controls if the row created by rowCallback should be assigned as row matrix
   * @api public
   */
  addData(data: any[], rowCallback: Function, asMatrix: boolean) {
    if (Object.prototype.toString.call(data) !== "[object Array]") {
      return this;
    }
    for (var index = 0, limit = data.length; index < limit; index++) {
      var row = rowCallback(data[index]);
      if (asMatrix) {
        this.addRowMatrix(row);
      } else {
        this.addRow(row);
      }
    }
    return this;
  }

  /**
   * Reset the current row state
   *
   * @api public
   */
  clearRows() {
    this.__rows = [];
    this.__maxCells = 0;
    this.__colMaxes = [];
    this.__rowMaxes = [];
    return this;
  }

  /**
   * Apply an even spaced column justification
   *
   * @param {Boolean} on / off
   * @api public
   */
  setJustify(val = true) {
    this.__justify = !!val;
    return this;
  }

  /**
   * Convert the current instance to a JSON structure
   *
   * @return {Object} json representation
   * @api public
   */
  toJSON() {
    return {
      title: this.getTitle(),
      heading: this.getHeading(),
      rows: this.getRows(),
    };
  }

  /**
   * Populate the table from a JSON object
   *
   * @param {Object} json representation
   * @api public
   */
  parse(obj: AsciiData) {
    return this.clear()
      .setTitle(obj.title)
      .setHeading(obj.heading)
      .addRowMatrix(obj.rows);
  }

  /**
   * Render the table with the current information
   *
   * @return {String} formatted table
   * @api public
   */
  render() {
    var self = this,
      body = [],
      mLen = this.__maxCells,
      max = AsciiTable.arrayFill(mLen, 0),
      total = mLen * 3,
      rows = this.__rows,
      justify = 0,
      border = this.__border,
      all = this.__heading ? [this.__heading].concat(rows) : rows;

    // Calculate max table cell lengths across all rows
    for (let i = 0; i < all.length; i++) {
      const row = all[i] ?? [];
      for (let k = 0; k < mLen; k++) {
        const cell = row[k];
        max[k] = Math.max(max[k], cell ? cell.toString().length : 0);
      }
    }
    this.__colMaxes = max;

    this.__rowMaxes = this.__rows.map((row) => {
      return row.reduce(
        (cum: number, cur: string) => Math.max(cum, cur.split("\n").length),
        0,
      );
    });

    justify = this.__justify ? Math.max.apply(null, max) : 0;

    // Get
    max.forEach(function (x) {
      total += justify ? justify : x + self.__spacing;
    });
    justify && (total += max.length);
    total -= this.__spacing;

    // Heading
    border && body.push(this._seperator(total - mLen + 1, this.__top));
    if (this.__name) {
      body.push(this._renderTitle(total - mLen + 1));
      border && body.push(this._seperator(total - mLen + 1));
    }
    if (this.__heading) {
      body.push(
        this._renderRow(this.__heading ?? [], " ", this.__headingAlign),
      );
      body.push(this._rowSeperator(mLen, this.__fill));
    }
    for (var i = 0; i < this.__rows.length; i++) {
      body.push(this._renderRow(this.__rows[i], " "));
    }
    border && body.push(this._seperator(total - mLen + 1, this.__bottom));

    var prefix = this.options.prefix || "";
    return prefix + body.join("\n" + prefix);
  }

  valueOf() {
    return this.render();
  }

  toString() {
    return this.render();
  }

  /**
   * Create a line seperator
   *
   * @param {Number} string size
   * @param {String} side values (default '|')
   * @api private
   */
  private _seperator(len: number, sep?: string) {
    sep || (sep = this.__edge);
    return sep + AsciiTable.alignRight(sep, len, this.__fill);
  }

  /**
   * Create a row seperator
   *
   * @return {String} seperator
   * @api private
   */
  private _rowSeperator(len?: number, fill?: string) {
    var blanks = AsciiTable.arrayFill(
      len || this.__maxCells,
      fill || this.__fill,
    );
    return this._renderRow(blanks, this.__fill);
  }

  /**
   * Render the table title in a centered box
   *
   * @param {Number} string size
   * @return {String} formatted title
   * @api private
   */
  private _renderTitle(len: number) {
    var name = " " + this.__name + " ",
      str = AsciiTable.align(this.__nameAlign, name, len - 1, " ");
    return this.__edge + str + this.__edge;
  }

  /**
   * Render an invdividual row
   *
   * @param {Array} row
   * @param {String} column seperator
   * @param {Number} total row alignment (optional, default `auto`)
   * @return {String} formatted row
   * @api private
   */
  private _renderRow(row: any[], str?: string, align?: AsciiAlign) {
    var tmp = [""],
      max = this.__colMaxes;

    for (var k = 0; k < this.__maxCells; k++) {
      var cell = row[k],
        just = this.__justify ? Math.max.apply(null, max) : max[k],
        // , pad = k === this.__maxCells - 1 ? just : just + this.__spacing
        pad = just,
        cAlign = this.__aligns[k],
        use = align,
        method = "alignAuto";

      if (typeof align === "undefined") use = cAlign;

      if (use === AsciiAlign.LEFT) method = "alignLeft";
      if (use === AsciiAlign.CENTER) method = "alignCenter";
      if (use === AsciiAlign.RIGHT) method = "alignRight";
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      tmp.push(AsciiTable[method](cell, pad, str));
    }
    var front = tmp.join(str + this.__edge + str);
    front = front.substr(1, front.length);
    return front + str + this.__edge;
  }
}
